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
          website: data.website || '',
          embed_youtube: data.embed_youtube || '',
          embed_soundcloud: data.embed_soundcloud || '',
          embed_bandcamp: data.embed_bandcamp || '',
          tip_jar_url: '',
        });
      } catch (err) {
        setError('Error loading artist profile');
      }
    };
    fetchArtist();
  }, [slug]);

  useEffect(() => {
    if (user === null) {
      setError("You must be logged in to access this page.");
      router.push('/login');
    }
  }, [user]);
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
  

  return (
    <div className="max-w-xl mx-auto p-6 text-white">
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

        <input name="embed_youtube" value={form.embed_youtube} onChange={handleChange} placeholder="YouTube Embed Link" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <input name="embed_soundcloud" value={form.embed_soundcloud} onChange={handleChange} placeholder="SoundCloud Embed Link" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <input name="embed_bandcamp" value={form.embed_bandcamp} onChange={handleChange} placeholder="Bandcamp Embed Link" className="w-full p-2 rounded bg-gray-800 border border-gray-600" />

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
  );
}