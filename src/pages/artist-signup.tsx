import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import TrialBanner from '@/components/TrialBanner';
import { isTrialActive } from '@/util/isTrialActive';

const topGenres = [
  'Jazz', 'Rock', 'Pop', 'Hip-Hop', 'R&B', 'Electronic',
  'Country', 'Reggae', 'Soul', 'Funk', 'Blues', 'Indie'
];

export default function ArtistSignupPage() {
  const { user } = useAuth();
  const router = useRouter();

  const trialActive = isTrialActive(user?.trial_ends_at);
  const trialExpired = user && !user.is_pro && !!user.trial_ends_at && !trialActive;

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
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
  
    let cleanValue = value;
  
    // Auto-extract iframe src if user pastes embed code
    const iframeMatch = value.match(/<iframe.*?src=["'](.*?)["']/);
    if (iframeMatch) {
      cleanValue = iframeMatch[1]; // The extracted src URL
    }
  
    setForm(prev => ({ ...prev, [name]: cleanValue }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || form.genres.length === 0 || !files.profile_image) {
      setError("Missing required fields");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
      

      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      formData.append('is_pro', 'true');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to create artist profile');

      const data = await res.json();
      router.push(`/artists/${data.slug}?trial=active`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (trialExpired) {
    return (
      <div className="max-w-xl mx-auto p-6 text-white text-center">
        <TrialBanner trial_ends_at={user!.trial_ends_at} is_pro={user!.is_pro} />
        <p className="mb-4">Your free trial has expired. Upgrade to Alpine Pro to manage an artist profile.</p>
        <Link href="/upgrade" className="text-blue-400 underline">Upgrade Now</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 text-white">
      <TrialBanner trial_ends_at={user?.trial_ends_at} is_pro={user?.is_pro} />
      <h1 className="text-2xl font-bold mb-2">🎤 Claim Your Artist Profile</h1>
      <p className="text-sm text-gray-300 mb-4">
        Create your public artist profile and enjoy 30 days of Alpine Pro access free.
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

        <input name="embed_youtube" placeholder="Paste YouTube embed link or iframe code" value={form.embed_youtube} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        {form.embed_youtube && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Preview:</p>
            <iframe
              src={form.embed_youtube}
              title="YouTube Preview"
              width="100%"
              height="250"
              className="rounded border border-gray-600"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <input name="embed_soundcloud" placeholder="Paste SoundCloud embed link or iframe code" value={form.embed_soundcloud} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        {form.embed_soundcloud && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Preview:</p>
            <iframe
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={form.embed_soundcloud}
              className="rounded border border-gray-600"
            />
          </div>
        )}

        <input name="embed_bandcamp" placeholder="Paste Bandcamp embed link or iframe code" value={form.embed_bandcamp} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        {form.embed_bandcamp && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Preview:</p>
            <iframe
              style={{ border: '0', width: '100%', height: '120px' }}
              src={form.embed_bandcamp}
              seamless
              className="rounded border border-gray-600"
            />
          </div>
        )}

        <label className="block text-sm font-semibold mt-4">Promo Photo</label>
        <input type="file" name="promo_photo" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />

        <label className="block text-sm font-semibold mt-4">Stage Plot</label>
        <input type="file" name="stage_plot" accept="image/*,.pdf" onChange={handleFileChange} className="w-full text-sm" />

        <label className="block text-sm font-semibold mt-4">Press Kit</label>
        <input type="file" name="press_kit" accept="application/pdf,image/*" onChange={handleFileChange} className="w-full text-sm" />

        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
          {loading ? 'Creating…' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
}
