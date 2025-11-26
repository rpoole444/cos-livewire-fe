// pages/artists/index.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import { isTrialActive } from '@/util/isTrialActive';
import { isActivePro } from '@/util/isActivePro';
import { useAuth } from '@/context/AuthContext';

interface Artist {
  display_name: string;
  slug: string;
  profile_image: string;
  genres: string[];
  bio: string;
  access_state?: 'pro' | 'trial' | 'gated' | 'none';
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
    <div className="min-h-screen bg-slate-950 text-white">
      <Head>
        <title>Artist Directory – Alpine Groove Guide</title>
        <meta name="description" content="Browse Alpine Pro pages for artists, venues, and promoters across Colorado" />
      </Head>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-center shadow-2xl ring-1 ring-slate-800">
          <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">Artist, Venue &amp; Promoter Directory</h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Discover Alpine Groove Guide Pro pages for artists, venues, and promoters across the Colorado Front Range.
          </p>
          {!isActivePro(user as any) && !isTrialActive(user?.trial_ends_at) && (
            <Link href="/upgrade">
              <button className="mt-4 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/20">
                Put your artist, venue, or series on Alpine Pro →
              </button>
            </Link>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input
              type="text"
              placeholder="Search by name or genre"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-slate-700 bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-slate-400">Loading artists...</p>
        ) : filteredArtists.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-center">
            <p className="text-sm text-slate-300">
              No Pro pages yet. Be the first to create a profile for your artist, venue, or promoter series.
            </p>
            <Link href="/artist-signup">
              <button className="mt-4 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/20">
                Create Your Pro Page
              </button>
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
            {filteredArtists.map((artist) => {
              const hasImage = Boolean(artist.profile_image);
              const initials = artist.display_name
                .split(' ')
                .map((word) => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const truncatedBio =
                artist.bio && artist.bio.length > 100 ? `${artist.bio.slice(0, 97).trim()}…` : artist.bio;
              const accessState = artist.access_state ?? 'none';
              const isLocked = accessState === 'gated';

              return (
                <Link
                  key={artist.slug}
                  href={`/artists/${artist.slug}`}
                  aria-label={`View artist profile for ${artist.display_name}`}
                  className={`flex gap-4 rounded-3xl border p-4 text-left transition transform hover:scale-[1.02] hover:border-emerald-400/70 hover:bg-slate-900 hover:shadow-emerald-500/25 ${
                    isLocked ? 'border-amber-400/30 bg-slate-900/70' : 'border-slate-800/80 bg-slate-900/80'
                  }`}
                >
                  <div className="relative h-16 w-16 flex-shrink-0 rounded-2xl border border-slate-700/80 bg-slate-800/80 sm:h-20 sm:w-20">
                    {hasImage ? (
                      <Image
                        src={artist.profile_image}
                        alt={artist.display_name}
                        fill
                        className={`rounded-2xl object-cover ${isLocked ? 'opacity-60 blur-[1px]' : ''}`}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-sm font-semibold text-slate-200">
                        {initials}
                      </div>
                    )}
                    {isLocked && (
                      <span className="absolute left-1 top-1 rounded-full border border-amber-400/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-100 shadow-sm">
                        🔒 Profile locked
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={`text-base font-semibold sm:text-lg ${isLocked ? 'text-slate-200' : 'text-slate-50'}`}>
                        {artist.display_name}
                      </h2>
                      {accessState === 'pro' && (
                        <span className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
                          Alpine Pro
                        </span>
                      )}
                      {accessState === 'trial' && (
                        <span className="rounded-full border border-blue-400/60 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-100">
                          Trial
                        </span>
                      )}
                    </div>
                    {truncatedBio && (
                      <p className={`mt-1 text-xs sm:text-sm ${isLocked ? 'text-slate-500' : 'text-slate-400'}`}>{truncatedBio}</p>
                    )}
                    {artist.genres.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {artist.genres.map((genre) => (
                          <span
                            key={genre}
                            className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                    <span
                      className={`mt-auto text-xs ${isLocked ? 'text-amber-200' : 'text-emerald-300'} flex items-center gap-1`}
                    >
                      {isLocked ? '🔒 Profile locked' : 'View profile →'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
