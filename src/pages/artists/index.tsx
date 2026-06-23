// pages/artists/index.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { COMMUNITY_ARTIST_ACCESS_LABEL, hasArtistProfileAccess, isCommunityArtistAccessActive } from '@/util/communityAccess';
import {
  REGION_ALL,
  REGION_FILTER_OPTIONS,
  RegionFilterValue,
  getRegionLabel,
  normalizeRegionFilter,
} from '@/constants/regions';

interface Artist {
  display_name?: string;
  slug: string;
  profile_image?: string;
  genres?: string[];
  bio?: string;
  access_state?: 'pro' | 'trial' | 'gated' | 'community' | 'shell' | 'none';
  profile_type?: 'artist' | 'venue' | 'promoter';
  is_shell?: boolean;
  home_region?: string;
  venue_city?: string;
  venue_state?: string;
}

type ProfileTypeFilter = 'all' | 'artist' | 'venue' | 'promoter';

type ArtistDirectoryPageProps = {
  initialRegion?: RegionFilterValue;
  initialProfileType?: ProfileTypeFilter;
};

const normalizeProfileTypeFilter = (value: unknown): ProfileTypeFilter => {
  return value === 'artist' || value === 'venue' || value === 'promoter' ? value : 'all';
};

const profileTypeFilters: Array<{ value: ProfileTypeFilter; label: string; description: string }> = [
  { value: 'artist', label: 'Artists', description: 'Bands, solo artists, DJs, and performers' },
  { value: 'venue', label: 'Venues', description: 'Rooms, stages, bars, theaters, and halls' },
  { value: 'promoter', label: 'Promoters', description: 'Series, presenters, and music organizations' },
  { value: 'all', label: 'All', description: 'Every public profile type' },
];

export default function ArtistDirectoryPage({
  initialRegion = REGION_ALL,
  initialProfileType = 'artist',
}: ArtistDirectoryPageProps = {}) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionFilterValue>(initialRegion);
  const [profileTypeFilter, setProfileTypeFilter] = useState<ProfileTypeFilter>(initialProfileType);
  const router = useRouter();
  const { user } = useAuth()
  const communityAccessActive = isCommunityArtistAccessActive();
  const canCreateArtistPage = hasArtistProfileAccess(user);
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const filteredArtists = artists.filter((artist) => {
    const profileType = artist.profile_type || 'artist';
    if (selectedRegion !== REGION_ALL && artist.home_region !== selectedRegion) return false;
    if (profileTypeFilter !== 'all' && profileType !== profileTypeFilter) return false;

    const q = searchQuery.toLowerCase();
    const name = (artist.display_name || '').toLowerCase();
    const genresList = Array.isArray(artist.genres) ? artist.genres : [];
    const location = [artist.venue_city, artist.venue_state].filter(Boolean).join(' ');
    const regionLabel = getRegionLabel(artist.home_region).toLowerCase();
    const matchesQuery =
      name.includes(q) ||
      genresList.join(', ').toLowerCase().includes(q) ||
      location.toLowerCase().includes(q) ||
      regionLabel.includes(q) ||
      profileType.includes(q);
    return matchesQuery;
  });

  useEffect(() => {
    if (!router.isReady) return;
    const queryRegion = Array.isArray(router.query.region)
      ? router.query.region[0]
      : router.query.region;
    const queryType = Array.isArray(router.query.type)
      ? router.query.type[0]
      : router.query.type;

    setSelectedRegion(queryRegion ? normalizeRegionFilter(queryRegion) : initialRegion);
    setProfileTypeFilter(queryType ? normalizeProfileTypeFilter(queryType) : initialProfileType);
  }, [router.isReady, router.query.region, router.query.type, initialRegion, initialProfileType]);

  const updateFilters = (nextRegion = selectedRegion, nextProfileType = profileTypeFilter) => {
    setSelectedRegion(nextRegion);
    setProfileTypeFilter(nextProfileType);
    router.replace(
      {
        pathname: '/artists',
        query: {
          ...router.query,
          region: nextRegion === REGION_ALL ? undefined : nextRegion,
          type: nextProfileType === 'all' ? undefined : nextProfileType,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/artists/public-list?include_gated=true`, {
          credentials: 'include',
        });
        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.artists) ? data.artists : [];
        setArtists(list);
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
        <title>Pro Directory – Alpine Groove Guide</title>
        <meta name="description" content="Browse Alpine Pro pages for artists, venues, and promoters across Colorado" />
      </Head>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-center shadow-2xl ring-1 ring-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Community Directory</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-50 sm:text-4xl">Browse the Colorado music community</h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Find artists, venues, and music organizations across Colorado’s Front Range.
            {selectedRegion !== REGION_ALL ? ` Currently showing ${getRegionLabel(selectedRegion)}.` : ''}
          </p>
          {canCreateArtistPage ? (
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/artist-signup">
                <button className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/20">
                  {communityAccessActive ? 'Create a free artist page →' : 'Create an artist page →'}
                </button>
              </Link>
              <Link href="/venue-signup">
                <button className="rounded-full border border-amber-400/50 bg-amber-500/10 px-5 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-300 hover:bg-amber-500/20">
                  Create a venue page →
                </button>
              </Link>
            </div>
          ) : (
            <Link href="/upgrade">
              <button className="mt-4 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/20">
                Put your artist, venue, or series on Alpine Pro →
              </button>
            </Link>
          )}
          {communityAccessActive && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              {COMMUNITY_ARTIST_ACCESS_LABEL}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Show me</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {profileTypeFilters.map((filter) => {
              const active = profileTypeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateFilters(selectedRegion, filter.value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                    active
                      ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
                      : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500 hover:text-slate-50'
                  }`}
                >
                  <span className="block text-sm font-semibold">{filter.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{filter.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            aria-label="Filter directory by region"
            value={selectedRegion}
            onChange={(event) => updateFilters(normalizeRegionFilter(event.target.value), profileTypeFilter)}
            className="w-full rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none sm:max-w-56"
          >
            {REGION_FILTER_OPTIONS.map((region) => (
              <option key={region.slug} value={region.slug}>
                {region.label}
              </option>
            ))}
          </select>
          <div className="relative w-full sm:max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input
              type="text"
              placeholder="Search by name, type, genre, city, or region"
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
              const displayName = artist.display_name || 'Untitled Profile';
              const hasImage = Boolean(artist.profile_image);
              const imageSrc = hasImage ? (artist.profile_image as string) : '/alpine_groove_guide_icon.png';
              const initials = displayName
                .split(' ')
                .map((word) => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const truncatedBio =
                artist.bio && artist.bio.length > 100 ? `${artist.bio.slice(0, 97).trim()}…` : artist.bio;
              const genresList = Array.isArray(artist.genres) ? artist.genres : [];
              const accessState = artist.access_state ?? 'none';
              const isLocked = accessState === 'gated';
              const isShell = Boolean(artist.is_shell || accessState === 'shell');
              const profileType = artist.profile_type || 'artist';
              const profileLabel = profileType.charAt(0).toUpperCase() + profileType.slice(1);
              const cardClasses = `flex gap-4 rounded-3xl border p-4 text-left transition ${
                isShell
                  ? 'border-slate-800/80 bg-slate-900/60'
                  : `transform hover:scale-[1.02] hover:border-emerald-400/70 hover:bg-slate-900 hover:shadow-emerald-500/25 ${
                      isLocked ? 'border-amber-400/30 bg-slate-900/70' : 'border-slate-800/80 bg-slate-900/80'
                    }`
              }`;
              const cardContent = (
                <>
                  <div className="relative h-16 w-16 flex-shrink-0 rounded-2xl border border-slate-700/80 bg-slate-800/80 sm:h-20 sm:w-20">
                    {hasImage ? (
                      <Image
                        src={imageSrc}
                        alt={displayName}
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
                        {displayName}
                      </h2>
                      <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                        {profileLabel}
                      </span>
                      {isShell && (
                        <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-100">
                          Unclaimed
                        </span>
                      )}
                      {artist.home_region && (
                        <span className="rounded-full border border-amber-400/50 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-100">
                          {getRegionLabel(artist.home_region)}
                        </span>
                      )}
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
                    {isShell && (
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        This venue is listed from imported community calendars. The public profile will open after the
                        venue is claimed or completed.
                      </p>
                    )}
                    {profileType === 'venue' && (artist.venue_city || artist.venue_state) && (
                      <p className="mt-1 text-xs text-amber-100/80">
                        {[artist.venue_city, artist.venue_state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {genresList.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {genresList.map((genre) => (
                          <span
                            key={genre}
                            className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                      <span
                        className={`text-xs ${isShell ? 'text-slate-500' : isLocked ? 'text-amber-200' : 'text-emerald-300'} flex items-center gap-1`}
                      >
                        {isShell ? 'View unclaimed venue →' : isLocked ? '🔒 Profile locked' : 'View profile →'}
                      </span>
                    </div>
                  </div>
                </>
              );

              return (
                <Link
                  key={artist.slug}
                  href={`/artists/${artist.slug}`}
                  aria-label={isShell ? `View unclaimed venue listing for ${displayName}` : `View artist profile for ${displayName}`}
                  className={cardClasses}
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
