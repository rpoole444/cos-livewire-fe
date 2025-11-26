import { useState,useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import TrialBanner from '@/components/TrialBanner';
import { isTrialActive } from '@/util/isTrialActive';
import { isActivePro } from '@/util/isActivePro';
import { parseMediaInput } from '@/util/parseMediaInput';

const topGenres = [
  'Jazz', 'Rock', 'Pop', 'Hip-Hop', 'R&B', 'Electronic',
  'Country', 'Reggae', 'Soul', 'Funk', 'Blues', 'Indie'
];

interface ExistingArtist {
  slug?: string;
  display_name?: string;
  deleted_at?: string | null;
}

export default function ArtistSignupPage() {
  const { user, refreshSession, loading: authLoading } = useAuth();
  const router = useRouter();

  const trialActive = isTrialActive(user?.trial_ends_at);
  const proActive = isActivePro(user as any);
  const trialExpired = user && !proActive && !!user.trial_ends_at && !trialActive;

  const [form, setForm] = useState({
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

const hasAccess = !!proActive || !!trialActive;   // already pro or in trial?
const canStartTrial = !proActive && !trialActive; 
const [existingArtist, setExistingArtist] = useState<ExistingArtist | null>(null);
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
    if (!authLoading && !user) {
      router.replace("/login?next=/artist-signup");
    }
  }, [authLoading, user, router]);

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        const { artist } = await mine.json();
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
        if (data?.artist && !data.artist.deleted_at) {
          setExistingArtist(data.artist);
        }
      }
    } catch (err) {
      console.error("[artist-signup] existing artist check failed", err);
    } finally {
      setCheckingExisting(false);
    }
  })();
}, [user]);

useEffect(() => {
  if (!checkingExisting && existingArtist?.slug) {
    router.replace(`/artists/${existingArtist.slug}`);
  }
}, [checkingExisting, existingArtist?.slug, router]);

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

  if (existingArtist?.slug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        You already have a Pro page. Redirecting to your page…
      </div>
    );
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (existingArtist) {
    setError("You already have a Pro page. Manage it instead.");
    return;
  }
  if (!user || form.genres.length === 0 || !files.profile_image) {
    setError("Missing required fields");
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
      // Reuse existing
      const mineRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/mine`, { credentials: "include" });
      if (!mineRes.ok) throw new Error("You already have a Pro page, but we couldn't load it.");
      const mineJson = await mineRes.json();
      if (!mineJson?.artist?.id || !mineJson?.artist?.slug) throw new Error("Existing Pro page found but incomplete data.");
      artist = { id: mineJson.artist.id, slug: mineJson.artist.slug };
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

  if (existingArtist?.slug) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-center space-y-4">
        <p className="text-sm text-slate-300">
            You already have a Pro page: <span className="font-semibold text-slate-50">{existingArtist.display_name}</span>
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/artists/edit/${existingArtist.slug}`}
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Manage Pro Page
            </Link>
            <Link
              href={`/artists/${existingArtist.slug}`}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-300 hover:text-white"
            >
              View Public Page
            </Link>
            <Link href="/UserProfile" className="text-xs text-slate-400 hover:text-slate-200">
              Return to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Artist Signup – Alpine Groove Guide</title>
      </Head>
      <div className="max-w-xl mx-auto p-6 text-white">
        <TrialBanner trial_ends_at={user?.trial_ends_at} />
        <h1 className="text-2xl font-bold mb-2">🎤 Claim Your Artist Profile</h1>
      <p className="text-sm text-gray-300 mb-4">
        Create your public Pro page for your artist, venue, or promoter series and enjoy 30 days of Alpine Pro access free.
        Add your music, bio, media kit, and upcoming shows — no credit card required!
      </p>      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="display_name" placeholder="Display Name" value={form.display_name} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />

        <input
          name="slug"
          placeholder="URL Slug (e.g. reid-poole-quartet)"
          value={form.slug}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        />
        <p className="text-sm text-gray-400">
          This becomes your public link: <code>/artists/{form.slug || 'your-slug'}</code>
        </p>

        <label className="block text-sm font-semibold">Profile Image</label>
        <input type="file" name="profile_image" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />

        <input name="contact_email" placeholder="Contact Email" value={form.contact_email} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <textarea name="bio" placeholder="Bio" value={form.bio} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" rows={4} />

        <div>
          <label className="block font-semibold mb-1">Pick up to 4 Genres</label>
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

        <label className="block text-sm font-semibold mt-4">Promo Photo</label>
        <input type="file" name="promo_photo" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />

        <label className="block text-sm font-semibold mt-4">Stage Plot</label>
        <input type="file" name="stage_plot" accept="image/*,.pdf" onChange={handleFileChange} className="w-full text-sm" />

        <label className="block text-sm font-semibold mt-4">Press Kit</label>
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
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Creating…' : 'Create Profile & Continue'}
        </button>
      </form>
    </div>
    </>
  );
}
