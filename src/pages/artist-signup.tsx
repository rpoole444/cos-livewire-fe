import { useState,useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import TrialBanner from '@/components/TrialBanner';
import { isTrialActive } from '@/util/isTrialActive';
import { isActivePro } from '@/util/isActivePro';
import { parseMediaInput } from '@/util/parseMediaInput';
import { COMMUNITY_ARTIST_ACCESS_LABEL, hasArtistProfileAccess, isCommunityArtistAccessActive } from '@/util/communityAccess';
import { Building2, Megaphone, Mic2 } from 'lucide-react';
import { DEFAULT_REGION, MUSIC_REGIONS } from '@/constants/regions';

const topGenres = [
  'Jazz', 'Rock', 'Pop', 'Hip-Hop', 'R&B', 'Electronic',
  'Country', 'Reggae', 'Soul', 'Funk', 'Blues', 'Indie'
];

interface ExistingArtist {
  id?: number;
  slug?: string;
  display_name?: string;
  deleted_at?: string | null;
  profile_type?: ProfileType;
}

type ProfileType = 'artist' | 'venue' | 'promoter';

type ArtistSignupPageProps = {
  initialProfileType?: ProfileType;
};

export default function ArtistSignupPage({ initialProfileType = 'artist' }: ArtistSignupPageProps) {
  const { user, refreshSession, loading: authLoading } = useAuth();
  const router = useRouter();
  const invite = router.query.invite;
  const inviteCode = typeof invite === 'string' ? invite : undefined;

  const trialActive = isTrialActive(user?.trial_ends_at);
  const proActive = isActivePro(user as any);
  const communityAccessActive = isCommunityArtistAccessActive();
  const trialExpired = user && !communityAccessActive && !proActive && !!user.trial_ends_at && !trialActive;

  const [form, setForm] = useState({
    profile_type: initialProfileType,
    display_name: '',
    bio: '',
    contact_email: user?.email || '',
    genres: [] as string[],
    slug: '',
    embed_youtube: '',
    embed_soundcloud: '',
    embed_bandcamp: '',
    website: '',
    tip_jar_url: '',
    home_region: DEFAULT_REGION,
    venue_address: '',
    venue_city: '',
    venue_state: 'Colorado',
    venue_postal_code: '',
    venue_phone: '',
    booking_email: user?.email || '',
    venue_capacity: '',
    age_policy: '',
    venue_stage_size: '',
    venue_pa_details: '',
    venue_backline: '',
    venue_load_in: '',
    venue_parking: '',
    venue_green_room: '',
    venue_sound_contact: '',
    venue_booking_policy: '',
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    profile_image: null,
    promo_photo: null,
    stage_plot: null,
    press_kit: null,
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
const [choice, setChoice] = useState<null | 'trial' | 'subscribe'>(null);
const [plan, setPlan] = useState<'monthly'|'annual'>('monthly');

const hasAccess = hasArtistProfileAccess(user);   // paid, trial, or community campaign access
const canStartTrial = !communityAccessActive && !proActive && !trialActive; 
const [existingProfiles, setExistingProfiles] = useState<ExistingArtist[]>([]);
const [checkingExisting, setCheckingExisting] = useState(true);
const [mediaInputs, setMediaInputs] = useState({
  youtube: '',
  soundcloud: '',
  bandcamp: '',
});
const [mediaErrors, setMediaErrors] = useState({
  youtube: '',
  soundcloud: '',
  bandcamp: '',
});

  useEffect(() => {
    if (!authLoading && !user && router.isReady) {
      const inviteQuery = inviteCode ? `&invite=${encodeURIComponent(inviteCode)}` : '';
      const requestedType = router.query.type || router.query.profile_type;
      const profileTypeQuery =
        requestedType === 'promoter' || requestedType === 'artist'
          ? `?type=${requestedType}`
          : '';
      const signupPath = initialProfileType === 'venue' ? '/venue-signup' : `/artist-signup${profileTypeQuery}`;
      router.replace(`/RegisterPage?redirect=${encodeURIComponent(signupPath)}${inviteQuery}`);
    }
  }, [authLoading, user, router, router.isReady, router.query.type, router.query.profile_type, inviteCode, initialProfileType]);

  useEffect(() => {
    if (!router.isReady) return;
    const requestedType = router.query.type || router.query.profile_type;
    if (requestedType === 'venue' || requestedType === 'promoter' || requestedType === 'artist') {
      setForm((prev) => ({ ...prev, profile_type: requestedType }));
    }
  }, [router.isReady, router.query.type, router.query.profile_type]);

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

const handleMediaInputChange = (
  provider: 'youtube' | 'bandcamp' | 'soundcloud',
  value: string
) => {
    const fieldMap = {
      youtube: 'embed_youtube',
      soundcloud: 'embed_soundcloud',
      bandcamp: 'embed_bandcamp',
    } as const;
    setMediaInputs((prev) => ({ ...prev, [provider]: value }));
    const { embedUrl, error } = parseMediaInput(value, provider);

    setMediaErrors((prev) => ({ ...prev, [provider]: error }));
    setForm((prev) => ({
      ...prev,
      [fieldMap[provider]]: embedUrl,
    }));
  };
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: selected } = e.target;
    if (selected && selected.length > 0) {
      setFiles(prev => ({ ...prev, [name]: selected[0] }));
    }
  };

  const handleGenreToggle = (genre: string) => {
    setForm(prev => {
      const alreadySelected = prev.genres.includes(genre);
      const newGenres = alreadySelected
        ? prev.genres.filter(g => g !== genre)
        : prev.genres.length < 4
          ? [...prev.genres, genre]
          : prev.genres;

      if (!alreadySelected && prev.genres.length >= 4) {
        setError('You can only select up to 4 genres.');
      } else {
        setError('');
      }

      return { ...prev, genres: newGenres };
    });
  };

useEffect(() => {
  if (!router.isReady) return;
  const { success, artist_id } = router.query;
  (async () => {
    if (success === 'true' && artist_id) {
      try {
        await refreshSession(); // now is_pro should be true
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${artist_id}/publish`, {
          method: 'PUT',
          credentials: 'include',
        });
        const mine = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/mine`, { credentials: 'include' });
        const mineJson = await mine.json().catch(() => null);
        const profiles = Array.isArray(mineJson?.profiles)
          ? mineJson.profiles
          : mineJson?.artist
            ? [mineJson.artist]
            : [];
        const artist = profiles.find((profile: ExistingArtist) => Number(profile.id) === Number(artist_id)) || mineJson?.artist;
        if (artist?.slug) router.replace(`/artists/${artist.slug}?pending=true`);
        else router.replace('/UserProfile');
      } catch {}
    }
  })();
}, [router.isReady]); // eslint-disable-line

useEffect(() => {
  if (!user) {
    setCheckingExisting(false);
    return;
  }
  (async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/mine`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const profiles = Array.isArray(data?.profiles)
          ? data.profiles
          : data?.artist
            ? [data.artist]
            : [];
        setExistingProfiles(profiles.filter((profile: ExistingArtist) => profile && !profile.deleted_at));
      }
    } catch (err) {
      console.error("[artist-signup] existing artist check failed", err);
    } finally {
      setCheckingExisting(false);
    }
  })();
}, [user]);

  if (authLoading || checkingExisting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        Checking your artist access…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        Redirecting to login…
      </div>
    );
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || form.genres.length === 0 || !files.profile_image) {
    setError("Missing required fields");
    return;
  }
  if (form.profile_type === 'venue' && (!form.venue_address.trim() || !form.venue_city.trim())) {
    setError("Venue address and city are required.");
    return;
  }
  if (!hasAccess && !choice) {
    setError("Choose Trial or Subscribe to continue.");
    return;
  }
  if (Object.values(mediaErrors).some(Boolean)) {
    setError("Fix the highlighted media links before submitting.");
    return;
  }

  setIsSubmitting(true);
  setError('');
  try {
    // 1) Create (or reuse) a draft
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) =>
      formData.append(k, Array.isArray(v) ? JSON.stringify(v) : String(v ?? ""))
    );
    Object.entries(files).forEach(([k, f]) => { if (f) formData.append(k, f); });

    let artist: { id: number; slug: string } | null = null;
    const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (createRes.ok) {
      artist = await createRes.json();
    } else if (createRes.status === 409) {
      let body: any = null;
      try { body = await createRes.json(); } catch {}
      const msg = (body?.message || "").toLowerCase();
      if (msg.includes("slug")) {
        throw new Error(body?.message || "That URL slug is already taken. Please choose another.");
      }
      throw new Error(body?.message || "Could not create this Pro page.");
    } else {
      const text = await createRes.text().catch(() => "");
      throw new Error(text || "Failed to create artist profile");
    }

    if (!artist) throw new Error("Could not obtain artist draft.");

    // 2) If they already have access, just publish and route
    if (hasAccess) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${artist.id}/publish`, {
        method: "PUT",
        credentials: "include",
      });
      await refreshSession();
      router.push('/UserProfile?submitted=true');
      return;
    }

    // 3) Branch by choice
    if (choice === 'trial') {
      // Start trial
      const tRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/trial/start`, {
        method: "POST",
        credentials: "include",
      });
      if (!tRes.ok) {
        const tBody = await tRes.json().catch(() => null);
        const reason = tBody?.reason;
        if (!(reason === "already_pro" || reason === "trial_active")) {
          throw new Error(tBody?.message || "Could not start trial");
        }
      }
      // Publish
      const pubRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${artist.id}/publish`, {
        method: "PUT",
        credentials: "include",
      });
      if (!pubRes.ok) {
        const pBody = await pubRes.json().catch(() => null);
        throw new Error(pBody?.message || "Could not publish after starting trial");
      }
      await refreshSession();
      router.push(`/UserProfile?trial=active&pending=true`);
      return;
    }

    if (choice === 'subscribe') {
      const coRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-checkout-session`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          plan, // 'monthly' | 'annual'
          artistId: artist.id,
          intent: "publish_artist",
        }),
      });
      const co = await coRes.json().catch(() => ({}));
      if (!coRes.ok || !co?.url) {
        throw new Error(co?.message || "Checkout failed");
      }
      window.location.href = co.url; // to Stripe
      return;
    }

    // (should never hit here)
    throw new Error('Please choose Trial or Subscribe.');
  } catch (err: any) {
    setError(err.message || "Something went wrong");
  } finally {
    setIsSubmitting(false);
  }
};

  if (trialExpired) {
    return (
      <div className="max-w-xl mx-auto p-6 text-white text-center">
        <TrialBanner trial_ends_at={user!.trial_ends_at} />
        <p className="mb-4">Your free trial has expired. Upgrade to Alpine Pro to manage your Pro page.</p>
        <Link href="/upgrade" className="text-blue-400 underline">Upgrade Now</Link>
      </div>
    );
  }

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">Preparing Pro signup…</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{form.profile_type === 'venue' ? 'Venue Signup' : 'Pro Page Signup'} – Alpine Groove Guide</title>
      </Head>
      <div className="mx-auto max-w-3xl px-4 py-10 text-ivory sm:px-6">
        <TrialBanner trial_ends_at={user?.trial_ends_at} />
        {existingProfiles.length > 0 && (
          <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-50">
            <p className="font-semibold">
              You already manage {existingProfiles.length} Pro {existingProfiles.length === 1 ? 'page' : 'pages'}.
            </p>
            <p className="mt-1 text-emerald-50/75">
              Creating this page will add another profile to your dashboard without replacing your current one.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {existingProfiles.slice(0, 3).map((profile) => (
                profile.slug ? (
                  <Link
                    key={profile.id || profile.slug}
                    href={`/artists/${profile.slug}`}
                    className="rounded-full border border-emerald-300/40 px-3 py-1 text-xs font-semibold text-emerald-50 hover:bg-emerald-400/10"
                  >
                    {profile.display_name || profile.slug}
                  </Link>
                ) : null
              ))}
              <Link href="/UserProfile" className="rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800">
                Dashboard
              </Link>
            </div>
          </div>
        )}
        <header className="agg-panel agg-corner-frame mb-6 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-alpine">
            {form.profile_type === 'venue' ? 'Venue tools' : 'Alpine Pro directory'}
          </p>
          <h1 className="agg-display mt-2 text-3xl font-semibold text-sun-gold sm:text-4xl">
            {form.profile_type === 'venue' ? 'Claim Your Venue Page' : 'Claim Your Pro Page'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ivory/65">
        {communityAccessActive
          ? `${COMMUNITY_ARTIST_ACCESS_LABEL}. Create a public page for your artist, venue, or promoter series with no credit card required.`
          : "Create your public Pro page for your artist, venue, or promoter series and enjoy 30 days of Alpine Pro access free."}
        {" "}
        {form.profile_type === 'venue'
          ? 'Add your booking details, room information, media, and upcoming shows.'
          : 'Add your music, bio, media kit, and upcoming shows.'}
          </p>
        </header>
      {communityAccessActive && (
        <div className="mb-5 border border-alpine/50 bg-pine/30 p-4 text-sm text-mist">
          Alpine Pro billing is still available for supporters, but profile creation is open to the community right now.
        </div>
      )}
      <form onSubmit={handleSubmit} className="agg-profile-form agg-panel space-y-5 p-5 sm:p-8">
        <fieldset>
          <legend className="mb-3 block text-sm font-bold text-ivory">What kind of page are you creating?</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {(['artist', 'venue', 'promoter'] as ProfileType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, profile_type: type }))}
                className={`flex min-h-24 flex-col items-center justify-center gap-2 border px-3 py-3 text-sm font-bold capitalize transition ${
                  form.profile_type === type
                    ? 'border-gold bg-gold/15 text-sun-gold'
                    : 'border-gold/25 bg-black/40 text-ivory/60 hover:border-alpine hover:text-ivory'
                }`}
              >
                {type === 'artist' && <Mic2 className="h-5 w-5" />}
                {type === 'venue' && <Building2 className="h-5 w-5" />}
                {type === 'promoter' && <Megaphone className="h-5 w-5" />}
                {type}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="home_region" className="mb-2 block text-sm font-bold text-ivory">
            Home Region
          </label>
          <select
            id="home_region"
            name="home_region"
            value={form.home_region}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-600"
          >
            {MUSIC_REGIONS.map((region) => (
              <option key={region.slug} value={region.slug}>
                {region.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ivory/45">
            Choose the primary scene where this {form.profile_type} should be discoverable.
          </p>
        </div>

        <input
          name="display_name"
          placeholder={form.profile_type === 'venue' ? 'Venue Name' : 'Display Name'}
          value={form.display_name}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        />

        <input
          name="slug"
          placeholder={form.profile_type === 'venue' ? 'URL Slug (e.g. gold-room)' : 'URL Slug (e.g. reid-poole-quartet)'}
          value={form.slug}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        />
        <p className="text-sm text-gray-400">
          This becomes your public link: <code>/artists/{form.slug || 'your-slug'}</code>
        </p>

        <label className="block text-sm font-semibold">
          {form.profile_type === 'venue' ? 'Venue Logo or Photo' : 'Profile Image'}
        </label>
        <input type="file" name="profile_image" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />

        <input name="contact_email" placeholder="Contact Email" value={form.contact_email} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <textarea
          name="bio"
          placeholder={form.profile_type === 'venue' ? 'Tell fans and bookers about the room, neighborhood, and experience.' : 'Bio'}
          value={form.bio}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
          rows={4}
        />

        {form.profile_type === 'venue' && (
          <div className="agg-corner-frame space-y-4 border border-gold/35 bg-black/40 p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-alpine">Venue tools</p>
              <h2 className="agg-display mt-1 text-xl font-semibold text-sun-gold">Room &amp; Booking Details</h2>
              <p className="mt-2 text-xs leading-5 text-ivory/50">These details power your public page and prefill future event submissions.</p>
            </div>
            <input name="venue_address" required placeholder="Street Address" value={form.venue_address} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="venue_city" required placeholder="City" value={form.venue_city} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
              <input name="venue_state" placeholder="State" value={form.venue_state} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
              <input name="venue_postal_code" placeholder="ZIP" value={form.venue_postal_code} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
            </div>
            <input name="booking_email" type="email" placeholder="Booking Email" value={form.booking_email} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="venue_phone" type="tel" placeholder="Venue Phone" value={form.venue_phone} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
              <input name="venue_capacity" type="number" min="1" placeholder="Capacity" value={form.venue_capacity} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
            </div>
            <input name="age_policy" placeholder="Age Policy (e.g. All ages, 21+)" value={form.age_policy} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="venue_stage_size" placeholder="Stage size (e.g. 16x12)" value={form.venue_stage_size} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
              <input name="venue_sound_contact" placeholder="Sound contact" value={form.venue_sound_contact} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
            </div>
            <textarea name="venue_pa_details" placeholder="PA included / sound details" value={form.venue_pa_details} onChange={handleChange} rows={3} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
            <textarea name="venue_backline" placeholder="Backline available" value={form.venue_backline} onChange={handleChange} rows={3} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
            <textarea name="venue_booking_policy" placeholder="Booking policy or preferred inquiry details" value={form.venue_booking_policy} onChange={handleChange} rows={3} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
          </div>
        )}

        <div>
          <label className="block font-semibold mb-1">
            {form.profile_type === 'venue' ? 'Pick up to 4 music styles you host' : 'Pick up to 4 Genres'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {topGenres.map((genre) => (
              <label key={genre} className="flex items-center">
                <input type="checkbox" value={genre} checked={form.genres.includes(genre)} onChange={() => handleGenreToggle(genre)} className="mr-2" />
                {genre}
              </label>
            ))}
          </div>
        </div>

        <input name="website" placeholder="Website (https://...)" value={form.website} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <input
          name="tip_jar_url"
          placeholder="Tip Jar (Venmo/PayPal URL)"
          value={form.tip_jar_url}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        />

        <label className="block text-sm font-semibold text-gray-200 mb-1">YouTube (paste a link or embed code)</label>
        <input
          name="embed_youtube"
          placeholder="https://www.youtube.com/watch?v=… or the full embed snippet"
          value={mediaInputs.youtube}
          onChange={(e) => handleMediaInputChange('youtube', e.target.value)}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        />
        <p className="text-xs text-gray-400 mt-1">Paste a full link or the iframe snippet—we’ll format it for you.</p>
        {mediaErrors.youtube && (
          <p className="text-xs text-red-400 mt-1">{mediaErrors.youtube}</p>
        )}
        {form.embed_youtube && !mediaErrors.youtube && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Preview:</p>
            <div className="aspect-video w-full overflow-hidden rounded border border-gray-600">
              <iframe
                src={form.embed_youtube}
                title="YouTube Preview"
                width="100%"
                height="100%"
                className="h-full w-full"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <label className="block text-sm font-semibold text-gray-200 mt-4 mb-1">SoundCloud (paste a link or embed code)</label>
        <input
          name="embed_soundcloud"
          placeholder="https://soundcloud.com/... or the full embed snippet"
          value={mediaInputs.soundcloud}
          onChange={(e) => handleMediaInputChange('soundcloud', e.target.value)}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        />
        <p className="text-xs text-gray-400 mt-1">Drop any SoundCloud URL—we convert it to the player embed automatically.</p>
        {mediaErrors.soundcloud && (
          <p className="text-xs text-red-400 mt-1">{mediaErrors.soundcloud}</p>
        )}
        {form.embed_soundcloud && !mediaErrors.soundcloud && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Preview:</p>
            <iframe
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={form.embed_soundcloud}
              className="rounded border border-gray-600 w-full"
            />
          </div>
        )}

        <label className="block text-sm font-semibold text-gray-200 mt-4 mb-1">Bandcamp (paste a link or embed code)</label>
        <input
          name="embed_bandcamp"
          placeholder="https://artist.bandcamp.com/... or the full embed snippet"
          value={mediaInputs.bandcamp}
          onChange={(e) => handleMediaInputChange('bandcamp', e.target.value)}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        />
        <p className="text-xs text-gray-400 mt-1">Share an album, track, or full Bandcamp embed snippet.</p>
        {mediaErrors.bandcamp && (
          <p className="text-xs text-red-400 mt-1">{mediaErrors.bandcamp}</p>
        )}
        {form.embed_bandcamp && !mediaErrors.bandcamp && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Preview:</p>
            <iframe
              style={{ border: '0', width: '100%', height: '160px' }}
              src={form.embed_bandcamp}
              seamless
              className="rounded border border-gray-600 w-full"
            />
          </div>
        )}

        <label className="block text-sm font-semibold mt-4">
          {form.profile_type === 'venue' ? 'Room or Stage Photo' : 'Promo Photo'}
        </label>
        <input type="file" name="promo_photo" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />

        <label className="block text-sm font-semibold mt-4">
          {form.profile_type === 'venue' ? 'House Stage / Tech Specs' : 'Stage Plot'}
        </label>
        <input type="file" name="stage_plot" accept="image/*,.pdf" onChange={handleFileChange} className="w-full text-sm" />

        <label className="block text-sm font-semibold mt-4">
          {form.profile_type === 'venue' ? 'Venue One-Sheet or Booking Packet' : 'Press Kit'}
        </label>
        <input type="file" name="press_kit" accept="application/pdf,image/*" onChange={handleFileChange} className="w-full text-sm" />

        {/* Access choices */}
        {!hasAccess && (
          <div className="mt-6 border-t border-gray-700 pt-4 space-y-3">
            <p className="font-semibold">Choose how you want to go live:</p>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="goLiveChoice"
                checked={choice === 'trial'}
                onChange={() => setChoice('trial')}
                disabled={!canStartTrial}
              />
              <span>Start 30-day Free Trial & publish (no card required)</span>
              {!canStartTrial && (
                <span className="ml-2 text-xs text-gray-400">Already Pro or trial active</span>
              )}
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="goLiveChoice"
                checked={choice === 'subscribe'}
                onChange={() => setChoice('subscribe')}
              />
              <span>Subscribe to Alpine Pro & publish</span>
            </label>

            {choice === 'subscribe' && (
              <div className="flex items-center gap-4 pl-6 text-sm">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="plan"
                    checked={plan === 'monthly'}
                    onChange={() => setPlan('monthly')}
                  />
                  Monthly
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="plan"
                    checked={plan === 'annual'}
                    onChange={() => setPlan('annual')}
                  />
                  Annual
                </label>
              </div>
            )}

            <p className="text-xs text-gray-400">
              You can switch later. Trial ends automatically unless you subscribe.
            </p>
          </div>
        )}


        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting || (!hasAccess && !choice)}
          className="w-full border border-gold bg-gold px-5 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-sun-gold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? 'Creating…'
            : communityAccessActive
            ? `Create Free ${form.profile_type === 'venue' ? 'Venue' : 'Pro'} Page`
            : 'Create Profile & Continue'}
        </button>
      </form>
    </div>
    </>
  );
}
