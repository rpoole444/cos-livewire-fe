// pages/artists/index.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface Artist {
  display_name: string;
  slug: string;
  profile_image: string;
  genres: string[];
  bio: string;
}

export default function ArtistDirectoryPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/artists/public-list`);
        const data = await res.json();
        setArtists(data);
      } catch (err) {
        console.error('Error fetching artists:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [API_BASE_URL]);

  // Admin-only gate
  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <Header />
        <h1 className="text-3xl font-bold mb-6">🔒 Artist Directory</h1>
        <p className="text-gray-400">This section is currently available to site admins only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <Head>
        <title>Artist Directory | Alpine Groove Guide</title>
        <meta name="description" content="Browse all Alpine Pro artist profiles" />
      </Head>
      <Header />

      <div className="mb-6 bg-indigo-800 text-white p-4 rounded-xl shadow-xl text-center">
        <h2 className="text-2xl font-bold">🎙️ Discover Local Talent</h2>
        <p className="text-gray-200">Browse Alpine Pro artists and support your local scene.</p>
        <Link href="/artist-signup">
          <button className="mt-3 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold">
            Become an Alpine Pro Artist →
          </button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">🎶 Artist Directory</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <Link
              key={artist.slug}
              href={`/artists/${artist.slug}`}
              className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition block shadow-md"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={artist.profile_image}
                  alt={artist.display_name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-semibold">{artist.display_name}</h2>
                  <p className="text-sm text-gray-400">{artist.genres.join(', ')}</p>
                </div>
              </div>
              <p className="text-sm mt-2 text-gray-300 line-clamp-3">{artist.bio}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
