// pages/artists/edit/[slug].tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import TrialBanner from '@/components/TrialBanner';
import { isTrialActive } from '@/util/isTrialActive';
import { isActivePro } from '@/util/isActivePro';
import { parseMediaInput } from '@/util/parseMediaInput';
import { COMMUNITY_ARTIST_ACCESS_LABEL, isCommunityArtistAccessActive } from '@/util/communityAccess';
import { DEFAULT_REGION, MUSIC_REGIONS } from '@/constants/regions';

const topGenres = [
  'Jazz', 'Rock', 'Pop', 'Hip-Hop', 'R&B', 'Electronic',
  'Country', 'Reggae', 'Soul', 'Funk', 'Blues', 'Indie'
];

export default function EditArtistProfilePage() {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();

  const trialActive = isTrialActive(user?.trial_ends_at);
  const proActive = isActivePro(user as any);
  const communityAccessActive = isCommunityArtistAccessActive();
  const trialExpired = user && !communityAccessActive && !proActive && !!user.trial_ends_at && !trialActive;

  const [form, setForm] = useState({
    profile_type: 'artist' as 'artist' | 'venue' | 'promoter',
    display_name: '',
    bio: '',
    contact_email: '',
    profile_image: '',
    genres: [] as string[],
    website: '',
    embed_youtube: '',
    embed_soundcloud: '',
    embed_bandcamp: '',
    tip_jar_url: '',
    home_region: DEFAULT_REGION,
    venue_address: '',
    venue_city: '',
    venue_state: '',
    venue_postal_code: '',
    venue_phone: '',
    booking_email: '',
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

  const [files, setFiles] = useState({
    profile_image: null,
    promo_photo: null,
    stage_plot: null,
    press_kit: null,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    if (!slug) return;
    const fetchArtist = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${slug}`, {
          credentials: 'include',
        });
        const data = await res.json();
        const nextForm = {
          profile_type: data.profile_type || 'artist',
          display_name: data.display_name,
          bio: data.bio,
          contact_email: data.contact_email,
          profile_image: data.profile_image,
          genres: data.genres || [],
          website: data.website || '',
          embed_youtube: data.embed_youtube || '',
          embed_soundcloud: data.embed_soundcloud || '',
          embed_bandcamp: data.embed_bandcamp || '',
          tip_jar_url: data.tip_jar_url || '',
          home_region: data.home_region || DEFAULT_REGION,
          venue_address: data.venue_address || '',
          venue_city: data.venue_city || '',
          venue_state: data.venue_state || '',
          venue_postal_code: data.venue_postal_code || '',
          venue_phone: data.venue_phone || '',
          booking_email: data.booking_email || '',
          venue_capacity: data.venue_capacity ? String(data.venue_capacity) : '',
          age_policy: data.age_policy || '',
          venue_stage_size: data.venue_stage_size || '',
          venue_pa_details: data.venue_pa_details || '',
          venue_backline: data.venue_backline || '',
          venue_load_in: data.venue_load_in || '',
          venue_parking: data.venue_parking || '',
          venue_green_room: data.venue_green_room || '',
          venue_sound_contact: data.venue_sound_contact || '',
          venue_booking_policy: data.venue_booking_policy || '',
        };
        setForm(nextForm);
        setMediaInputs({
          youtube: nextForm.embed_youtube,
          soundcloud: nextForm.embed_soundcloud,
          bandcamp: nextForm.embed_bandcamp,
        });
        setMediaErrors({ youtube: '', soundcloud: '', bandcamp: '' });
      } catch (err) {
        setError('Error loading artist profile');
      }
    };
    fetchArtist();
  }, [slug]);

  useEffect(() => {
    if (router.isReady && user === null) {
      setError("You must be logged in to access this page.");
      router.push('/login');
    }
  }, [user, router]);
  

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
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles?.[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleGenreToggle = (genre: string) => {
    setForm(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : prev.genres.length < 4 ? [...prev.genres, genre] : prev.genres
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!user || !slug) {
      setError("You must be logged in to edit your profile.");
      return;
    }
  
    if (Object.values(mediaErrors).some(Boolean)) {
      setError("Fix the highlighted media links before saving.");
      return;
    }
    if (form.profile_type === 'venue' && (!form.venue_address.trim() || !form.venue_city.trim())) {
      setError("Venue address and city are required.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
  
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
    });
  
    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });
  
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${slug}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });
  
      if (res.status === 401) {
        setError("Your session has expired. Redirecting to login...");
        setTimeout(() => router.push('/login'), 2000);
        return;
      }
  
      if (!res.ok) throw new Error('Failed to update artist profile');
      router.push(`/artists/${slug}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (trialExpired) {
    return (
      <div className="max-w-xl mx-auto p-6 text-white text-center">
        <TrialBanner trial_ends_at={user!.trial_ends_at} />
        <p className="mb-4">Your free trial has expired. Upgrade to Alpine Pro to edit your Pro page.</p>
        <Link href="/upgrade" className="text-blue-400 underline">Upgrade Now</Link>
      </div>
    );
  }
  

  const pageTitle = form.display_name
    ? `Edit ${form.display_name} – Alpine Groove Guide`
    : 'Edit Pro Page – Alpine Groove Guide';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <div className="max-w-xl mx-auto p-6 text-white">
        <TrialBanner trial_ends_at={user?.trial_ends_at} />
        {communityAccessActive && (
          <div className="mb-5 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            {COMMUNITY_ARTIST_ACCESS_LABEL}. You can keep this profile updated while community access is open.
          </div>
        )}
        <h1 className="text-2xl font-bold mb-4">
          Edit {form.profile_type === 'venue' ? 'Venue' : 'Pro'} Profile
        </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Profile Type
          <select
            name="profile_type"
            value={form.profile_type}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                profile_type: e.target.value as 'artist' | 'venue' | 'promoter',
              }))
            }
            className="mt-1 w-full rounded border border-gray-600 bg-gray-800 p-2"
          >
            <option value="artist">Artist</option>
            <option value="venue">Venue</option>
            <option value="promoter">Promoter</option>
          </select>
        </label>
        <label className="block">
          Home Region
          <select
            name="home_region"
            value={form.home_region}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-600 bg-gray-800 p-2"
          >
            {MUSIC_REGIONS.map((region) => (
              <option key={region.slug} value={region.slug}>
                {region.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-gray-400">
            This controls where your profile is discoverable as regional browsing expands.
          </span>
        </label>
        <input name="display_name" value={form.display_name} onChange={handleChange} placeholder="Display Name" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <input name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="Contact Email" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <input name="website" value={form.website} onChange={handleChange} placeholder="Website URL" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Bio" className="w-full p-2 rounded bg-gray-800 border border-gray-600" rows={4} />

        {form.profile_type === 'venue' && (
          <div className="space-y-4 rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-4">
            <h2 className="font-semibold text-emerald-100">Venue details</h2>
            <input name="venue_address" required value={form.venue_address} onChange={handleChange} placeholder="Street Address" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="venue_city" required value={form.venue_city} onChange={handleChange} placeholder="City" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
              <input name="venue_state" value={form.venue_state} onChange={handleChange} placeholder="State" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
              <input name="venue_postal_code" value={form.venue_postal_code} onChange={handleChange} placeholder="ZIP" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
            </div>
            <input name="booking_email" type="email" value={form.booking_email} onChange={handleChange} placeholder="Booking Email" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="venue_phone" type="tel" value={form.venue_phone} onChange={handleChange} placeholder="Venue Phone" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
              <input name="venue_capacity" type="number" min="1" value={form.venue_capacity} onChange={handleChange} placeholder="Capacity" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
            </div>
            <input name="age_policy" value={form.age_policy} onChange={handleChange} placeholder="Age Policy" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
            <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
              <h3 className="text-sm font-semibold text-emerald-100">Public room details</h3>
              <p className="mt-1 text-xs text-gray-400">These help fans and bookers understand the room at a glance.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input name="venue_stage_size" value={form.venue_stage_size} onChange={handleChange} placeholder="Stage size (e.g. 16x12)" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
                <input name="venue_sound_contact" value={form.venue_sound_contact} onChange={handleChange} placeholder="Sound contact" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
              </div>
              <textarea name="venue_pa_details" value={form.venue_pa_details} onChange={handleChange} placeholder="PA included / sound details" rows={3} className="mt-3 w-full p-2 rounded bg-gray-800 border border-gray-600" />
              <textarea name="venue_backline" value={form.venue_backline} onChange={handleChange} placeholder="Backline available" rows={3} className="mt-3 w-full p-2 rounded bg-gray-800 border border-gray-600" />
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-4">
              <h3 className="text-sm font-semibold text-amber-100">Play this room details</h3>
              <p className="mt-1 text-xs text-gray-400">These appear for logged-in artists and help reduce back-and-forth before booking.</p>
              <textarea name="venue_load_in" value={form.venue_load_in} onChange={handleChange} placeholder="Load-in instructions" rows={3} className="mt-3 w-full p-2 rounded bg-gray-800 border border-gray-600" />
              <textarea name="venue_parking" value={form.venue_parking} onChange={handleChange} placeholder="Artist parking" rows={3} className="mt-3 w-full p-2 rounded bg-gray-800 border border-gray-600" />
              <textarea name="venue_green_room" value={form.venue_green_room} onChange={handleChange} placeholder="Green room / hospitality" rows={3} className="mt-3 w-full p-2 rounded bg-gray-800 border border-gray-600" />
              <textarea name="venue_booking_policy" value={form.venue_booking_policy} onChange={handleChange} placeholder="Booking policy, advance requirements, or preferred inquiry details" rows={4} className="mt-3 w-full p-2 rounded bg-gray-800 border border-gray-600" />
            </div>
          </div>
        )}
        <label className="block mb-2">
          Tip Jar URL (PayPal/Venmo):
          <input
            type="text"
            name="tip_jar_url"
            value={form.tip_jar_url}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-gray-800 text-white"
            placeholder="https://venmo.com/u/yourhandle or PayPal.me/yourname"
          />
        </label>

        <label className="block text-sm font-semibold text-gray-200 mb-1">YouTube (paste a link or embed code)</label>
        <input
          name="embed_youtube"
          value={mediaInputs.youtube}
          onChange={(e) => handleMediaInputChange('youtube', e.target.value)}
          placeholder="https://www.youtube.com/watch?v=… or the full embed snippet"
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        />
        <p className="text-xs text-gray-400 mt-1">Paste any YouTube link—we’ll convert it to the embed player.</p>
        {mediaErrors.youtube && <p className="text-xs text-red-400">{mediaErrors.youtube}</p>}
        {form.embed_youtube && !mediaErrors.youtube && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Preview:</p>
            <div className="aspect-video w-full overflow-hidden rounded border border-gray-600">
              <iframe
                src={form.embed_youtube}
                title="YouTube Preview"
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
          value={mediaInputs.soundcloud}
          onChange={(e) => handleMediaInputChange('soundcloud', e.target.value)}
          placeholder="https://soundcloud.com/... or embed snippet"
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        />
        <p className="text-xs text-gray-400 mt-1">Drop a SoundCloud link and we’ll render the player below.</p>
        {mediaErrors.soundcloud && <p className="text-xs text-red-400">{mediaErrors.soundcloud}</p>}
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
          value={mediaInputs.bandcamp}
          onChange={(e) => handleMediaInputChange('bandcamp', e.target.value)}
          placeholder="https://artist.bandcamp.com/... or embed snippet"
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        />
        <p className="text-xs text-gray-400 mt-1">We’ll extract the embedded player automatically.</p>
        {mediaErrors.bandcamp && <p className="text-xs text-red-400">{mediaErrors.bandcamp}</p>}
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

        <label className="block">Upload New Profile Image:
          <input type="file" accept="image/*" name="profile_image" onChange={handleFileChange} className="w-full text-sm mt-1" />
        </label>

        <label className="block">Upload {form.profile_type === 'venue' ? 'Room or Stage Photo' : 'Promo Photo'}:
          <input type="file" accept="image/*" name="promo_photo" onChange={handleFileChange} className="w-full text-sm mt-1" />
        </label>

        <label className="block">Upload {form.profile_type === 'venue' ? 'House Stage / Tech Specs' : 'Stage Plot'}:
          <input type="file" name="stage_plot" onChange={handleFileChange} className="w-full text-sm mt-1" />
        </label>

        <label className="block">Upload {form.profile_type === 'venue' ? 'Venue Booking Packet' : 'Press Kit'}:
          <input type="file" name="press_kit" onChange={handleFileChange} className="w-full text-sm mt-1" />
        </label>

        <div>
          <label className="block font-semibold mb-1">
            {form.profile_type === 'venue' ? 'Music styles hosted (up to 4)' : 'Genres (up to 4)'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {topGenres.map(genre => (
              <label key={genre} className="flex items-center">
                <input type="checkbox" checked={form.genres.includes(genre)} onChange={() => handleGenreToggle(genre)} className="mr-2" />
                {genre}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
    </>
  );
}
