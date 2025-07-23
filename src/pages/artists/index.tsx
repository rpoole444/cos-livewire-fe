// pages/artists/index.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Header from '@/components/Header';
import Image from 'next/image';
import { isTrialActive } from '@/util/isTrialActive';
import { useAuth } from '@/context/AuthContext';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [zipFilter, setZipFilter] = useState('');
  const { user } = useAuth()
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const filteredArtists = artists.filter((artist) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      artist.display_name.toLowerCase().includes(q) ||
      artist.genres.join(', ').toLowerCase().includes(q);
    return matchesQuery;
  });

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
        {!user?.is_pro && !isTrialActive(user?.trial_ends_at) && (
          <Link href="/upgrade">
            <button className="mt-3 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold">
              Become an Alpine Pro Artist →
            </button>
          </Link>
        )}
      </div>

      <h1 className="text-3xl font-bold mb-6">🎶 Artist Directory</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or genre"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 rounded text-black flex-1"
        />
        <input
          type="text"
          placeholder="State (coming soon)"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="p-2 rounded text-black md:w-40"
        />
        <input
          type="text"
          placeholder="Zip (coming soon)"
          value={zipFilter}
          onChange={(e) => setZipFilter(e.target.value)}
          className="p-2 rounded text-black md:w-32"
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArtists.map((artist) => (
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
