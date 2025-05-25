// pages/artists/index.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';

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

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch('/api/artists/public-list');
        const data = await res.json();
        setArtists(data);
      } catch (err) {
        console.error('Error fetching artists:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <Head>
        <title>Artist Directory | Alpine Groove Guide</title>
        <meta name="description" content="Browse all Alpine Pro artist profiles" />
      </Head>

      <h1 className="text-3xl font-bold mb-6">🎶 Artist Directory</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map(artist => (
            <Link key={artist.slug} href={`/artists/${artist.slug}`} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition block">
              <div className="flex items-center gap-4">
                <img src={artist.profile_image} alt={artist.display_name} className="w-16 h-16 rounded-full object-cover" />
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
