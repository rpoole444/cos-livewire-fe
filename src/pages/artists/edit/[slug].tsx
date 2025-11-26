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
  const trialExpired = user && !proActive && !!user.trial_ends_at && !trialActive;

  const [form, setForm] = useState({
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${slug}`);
        const data = await res.json();
        const nextForm = {
          display_name: data.display_name,
          bio: data.bio,
          contact_email: data.contact_email,
          profile_image: data.profile_image,
          genres: data.genres || [],
          website: data.website || '',
          embed_youtube: data.embed_youtube || '',
          embed_soundcloud: data.embed_soundcloud || '',
          embed_bandcamp: data.embed_bandcamp || '',
          tip_jar_url: '',
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
    : 'Edit Artist Profile – Alpine Groove Guide';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <div className="max-w-xl mx-auto p-6 text-white">
        <TrialBanner trial_ends_at={user?.trial_ends_at} />
        <h1 className="text-2xl font-bold mb-4">Edit Artist Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="display_name" value={form.display_name} onChange={handleChange} placeholder="Display Name" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <input name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="Contact Email" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <input name="website" value={form.website} onChange={handleChange} placeholder="Website URL" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Bio" className="w-full p-2 rounded bg-gray-800 border border-gray-600" rows={4} />
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

        <label className="block">Upload Promo Photo:
          <input type="file" accept="image/*" name="promo_photo" onChange={handleFileChange} className="w-full text-sm mt-1" />
        </label>

        <label className="block">Upload Stage Plot:
          <input type="file" name="stage_plot" onChange={handleFileChange} className="w-full text-sm mt-1" />
        </label>

        <label className="block">Upload Press Kit:
          <input type="file" name="press_kit" onChange={handleFileChange} className="w-full text-sm mt-1" />
        </label>

        <div>
          <label className="block font-semibold mb-1">Genres (up to 4)</label>
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
