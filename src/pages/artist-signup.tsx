import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

const topGenres = [
  'Jazz', 'Rock', 'Pop', 'Hip-Hop', 'R&B', 'Electronic',
  'Country', 'Reggae', 'Soul', 'Funk', 'Blues', 'Indie'
];

export default function ArtistSignupPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    contact_email: user?.email || '',
    genres: [] as string[],
    slug: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
    if (!user || form.genres.length === 0 || !file) {
      setError("Missing required fields");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('display_name', form.display_name);
      formData.append('slug', form.slug);
      formData.append('bio', form.bio);
      formData.append('contact_email', form.contact_email);
      formData.append('profile_image', file);
      formData.append('genres', JSON.stringify(form.genres));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to create artist profile');

      const data = await res.json();
      router.push(`/artists/${data.slug}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Create Artist Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="display_name" placeholder="Display Name" value={form.display_name} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        
        <input name="slug" placeholder="Custom URL Slug (e.g. your-name)" value={form.slug} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <p className="text-sm text-gray-400">Your public profile will be at <code>/artists/{form.slug || 'your-slug'}</code></p>

        <label className="block text-sm font-semibold">Upload Profile Image</label>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm" />

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

        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
          {loading ? 'Creating…' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
}
