// pages/artists/edit/[slug].tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

const topGenres = [
  'Jazz', 'Rock', 'Pop', 'Hip-Hop', 'R&B', 'Electronic',
  'Country', 'Reggae', 'Soul', 'Funk', 'Blues', 'Indie'
];

export default function EditArtistProfilePage() {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();

  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    contact_email: '',
    profile_image: '',
    genres: [] as string[],
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchArtist = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${slug}`);
        const data = await res.json();
        setForm({
          display_name: data.display_name,
          bio: data.bio,
          contact_email: data.contact_email,
          profile_image: data.profile_image,
          genres: data.genres || [],
        });
      } catch (err) {
        setError('Error loading artist profile');
      }
    };
    fetchArtist();
  }, [slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
    if (!user || !slug) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('display_name', form.display_name);
    formData.append('bio', form.bio);
    formData.append('contact_email', form.contact_email);
    formData.append('genres', JSON.stringify(form.genres));
    if (file) formData.append('profile_image', file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${slug}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to update artist profile');
      router.push(`/artists/${slug}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Edit Artist Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="display_name" value={form.display_name} onChange={handleChange} placeholder="Display Name" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <input name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="Contact Email" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Bio" className="w-full p-2 rounded bg-gray-800 border border-gray-600" rows={4} />

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

        <label className="block">Upload New Profile Image:
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm mt-1" />
        </label>

        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
