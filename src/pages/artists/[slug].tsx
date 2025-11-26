// pages/artists/[slug].tsx
import { GetServerSideProps } from 'next';
import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import TrialBanner from '@/components/TrialBanner';
import { FaFacebookF, FaTwitter, FaLink, FaShareAlt } from 'react-icons/fa';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import EventPoster from '@/components/EventPoster';
dayjs.extend(utc);

interface Event {
  id: number;
  title: string;
  date: string;
  venue_name: string;
  location: string;
  genre: string;
  slug: string;
  poster?: string | null;
}

interface Artist {
  id: number;
  display_name: string;
  user_id: number;
  bio: string;
  contact_email: string;
  profile_image: string;
  promo_photo?: string;
  stage_plot?: string;
  press_kit?: string;
  embed_youtube?: string;
  embed_soundcloud?: string;
  embed_bandcamp?: string;
  website?: string;
  is_pro?: boolean;
  genres: string[];
  slug: string;
  tip_jar_url: string;
  events: Event[];
  trial_ends_at?: string | null;
  is_approved?: boolean;
}

interface Props {
  artist: Artist | null;
}

type MediaProvider = 'soundcloud' | 'bandcamp';

const ResponsiveMediaEmbed = ({
  src,
  provider,
  title,
}: {
  src: string;
  provider: MediaProvider;
  title: string;
}) => {
  const baseWrapper =
    'w-full max-w-4xl mx-auto mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40';
  const heightClasses =
    provider === 'soundcloud'
      ? 'h-[300px] sm:h-[360px] lg:h-[420px]'
      : 'h-[450px] sm:h-[520px] lg:h-[600px]';

  return (
    <div className={baseWrapper}>
      {/* Ensure embeds feel intentional across screen sizes by fixing sensible default heights per provider */}
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="autoplay"
        className={`w-full ${heightClasses}`}
        frameBorder="0"
        scrolling="no"
        allowFullScreen
      />
    </div>
  );
};

const ArtistProfilePage = ({ artist }: Props) => {
  const { user } = useAuth();
  const router = useRouter();
  const isPending = router.query.pending === 'true';
  const isOwner = user?.id === artist?.user_id;
  const canEdit = artist && user && (user.id === artist.user_id || user.is_admin);
  const [showTrialToast, setShowTrialToast] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isTrialExpired = artist?.trial_ends_at ? dayjs().isAfter(dayjs(artist.trial_ends_at), 'day') : true;
  const showPendingBanner = isPending && isOwner && artist && artist.is_approved === false;
  const logRef = useRef(false);
  const eventsLoggedRef = useRef(false);
  const pageTitle = artist?.display_name ? `${artist.display_name} – Profile` : 'Artist Profile – Alpine Groove Guide';

  useEffect(() => {
    if (artist && !logRef.current) {
      console.log('[ArtistProfilePage] loaded', { artistId: artist.id, slug: artist.slug });
      logRef.current = true;
    }
  }, [artist]);

  useEffect(() => {
    if (artist && !eventsLoggedRef.current) {
      console.log('[ArtistProfilePage] upcomingEvents', {
        count: artist.events?.length ?? 0,
        sample: artist.events?.slice(0, 2) ?? [],
      });
      eventsLoggedRef.current = true;
    }
  }, [artist]);

  useEffect(() => {
    if (router.query.trial === 'active') {
      setShowTrialToast(true);
      setTimeout(() => setShowTrialToast(false), 5000);
    }
  }, [router.query]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this Pro page?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${artist?.slug}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        alert('Artist profile deleted successfully.');
        router.push('/');
      } else {
        const errData = await res.json();
        alert(`Failed to delete artist: ${errData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting.');
    } finally {
      setDeleting(false);
    }
  };

  if (!artist) {
    return (
      <>
        <Head>
          <title>{pageTitle}</title>
        </Head>
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16 text-slate-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-2xl shadow-black/40">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400">Pro Page</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Profile not found</h1>
            <p className="mt-3 text-sm text-slate-400">
              This Pro page isn&apos;t available. Browse the directory to discover Alpine Groove Guide artists, venues, and promoters.
            </p>
            <Link
              href="/artists"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0"
            >
              View artist directory
            </Link>
          </div>
        </div>
      </>
    );
  }

  const siteBaseUrl = 'https://app.alpinegrooveguide.com';
  const shareUrl = `${siteBaseUrl}/share/artist/${artist.slug}`;
  const artistUrl = `${siteBaseUrl}/artists/${artist.slug}`;
  const description = artist.bio
    ? artist.bio.length > 150
      ? `${artist.bio.slice(0, 147).trim()}…`
      : artist.bio
    : `${artist.display_name} is featured on Alpine Groove Guide. Discover their upcoming shows.`;
  const ogImage =
    artist.profile_image && artist.profile_image.trim().length > 0
      ? artist.profile_image.startsWith('http')
        ? artist.profile_image
        : `${siteBaseUrl}${artist.profile_image}`
      : `${siteBaseUrl}/alpine_groove_guide_icon.png`;
  const shouldBlur = !artist.is_pro && (isTrialExpired || !artist.trial_ends_at);
  const limitedHeadline = isOwner
    ? "Upgrade your Alpine Pro page to unlock your full public profile."
    : "This Alpine Pro page hasn’t been fully unlocked yet.";
  const limitedBody = isOwner
    ? "Fans currently see a limited preview of your profile. Upgrade to Alpine Pro to reveal your full bio, media, downloads, and upcoming shows—perfect for artists, venues, and promoters."
    : "You’re seeing a limited preview because this artist, venue, or promoter hasn’t upgraded to Alpine Pro yet. When they do, their full media, downloads, and events will appear here.";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta property="og:site_name" content="Alpine Groove Guide" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={artistUrl} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          {showPendingBanner && (
            <div className="rounded bg-yellow-400 p-3 text-center text-sm font-medium text-black shadow">
              ⏳ Your Pro page is currently <strong>pending admin approval</strong>. You’ll be notified when approved.
            </div>
          )}
          {showTrialToast && isOwner && (
            <div className="rounded bg-green-600 p-2 text-center text-sm text-white shadow">✅ Your Alpine Pro trial is active.</div>
          )}
          {!isOwner && !artist.is_pro && isTrialExpired && (
            <div className="rounded bg-slate-800 p-3 text-center text-sm text-blue-300 shadow">
              📣 This Pro page’s Alpine Pro trial has ended.{' '}
              <Link href="/upgrade" className="underline hover:text-blue-200">
                Learn more about upgrading to Pro
              </Link>
              .
            </div>
          )}

          <TrialBanner artist_user_id={artist.user_id} trial_ends_at={artist.trial_ends_at} is_pro={artist.is_pro} />

          <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 ring-1 ring-slate-800 shadow-2xl shadow-black/30">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="flex flex-1 flex-col gap-5 sm:flex-row sm:items-center">
                <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-slate-900 shadow-xl ring-1 ring-slate-700 sm:mx-0">
                  {artist.profile_image ? (
                    <Image src={artist.profile_image} alt={artist.display_name} width={128} height={128} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-emerald-200">
                      {artist.display_name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold text-white sm:text-4xl">{artist.display_name}</h1>
                    {artist.is_pro && (
                      <span className="rounded-full border border-emerald-400/70 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                        Alpine Pro
                      </span>
                    )}
                  </div>
                  {artist.bio ? (
                    <p className="mt-4 mb-6 text-sm leading-relaxed text-slate-300">{artist.bio}</p>
                  ) : (
                    <p className="mt-4 mb-6 text-sm text-slate-400">This artist hasn’t added a bio yet.</p>
                  )}
                  {artist.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {artist.genres.map((genre) => (
                        <span key={genre} className="rounded-full border border-slate-700/80 px-3 py-1 text-xs font-medium text-slate-100">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 p-5 lg:max-w-sm">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Contact / Book
                </h3>
                <div className="mt-3 space-y-3">
                  {artist.contact_email &&
                    (shouldBlur ? (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-slate-300 opacity-60">
                        Contact / Book
                      </div>
                    ) : (
                      <a
                        href={`mailto:${artist.contact_email}`}
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-emerald-400/60 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/20"
                      >
                        Contact / Book
                      </a>
                    ))}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <a
                      href={artist.website?.startsWith('http') ? artist.website : `https://${artist.website ?? ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`rounded-2xl border border-slate-700 px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white ${
                        shouldBlur || !artist.website ? 'pointer-events-none opacity-60 blur-[1px]' : ''
                      }`}
                    >
                      Official Website →
                    </a>
                    <a
                      href={
                        artist.tip_jar_url?.startsWith('http')
                          ? artist.tip_jar_url
                          : artist.tip_jar_url
                          ? `https://${artist.tip_jar_url}`
                          : '#'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-center text-sm font-semibold text-amber-200 transition hover:border-amber-300 hover:bg-amber-500/20 ${
                        shouldBlur || !artist.tip_jar_url ? 'pointer-events-none opacity-60 blur-[1px]' : ''
                      }`}
                    >
                      Send a Tip 💐
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: artist.display_name,
                            url: shareUrl,
                          });
                        }
                      }}
                      className="flex flex-1 min-w-[120px] items-center justify-center gap-1 rounded-full border border-yellow-400/40 px-3 py-1 text-xs font-semibold text-yellow-200 transition hover:border-yellow-300 hover:text-white"
                    >
                      <FaShareAlt /> Share
                    </button>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 min-w-[120px] items-center justify-center gap-1 rounded-full border border-blue-500/40 px-3 py-1 text-xs font-semibold text-blue-200 transition hover:border-blue-400 hover:text-white"
                    >
                      <FaFacebookF /> Facebook
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(artist.display_name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 min-w-[120px] items-center justify-center gap-1 rounded-full border border-sky-500/40 px-3 py-1 text-xs font-semibold text-sky-200 transition hover:border-sky-400 hover:text-white"
                    >
                      <FaTwitter /> X
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        alert('Link copied to clipboard!');
                      }}
                      className="flex flex-1 min-w-[120px] items-center justify-center gap-1 rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-white hover:text-white"
                    >
                      <FaLink /> Copy
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            </section>

          {shouldBlur && (
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-5 text-center text-sm text-emerald-100">
              <p className="text-base font-semibold text-slate-50">{limitedHeadline}</p>
              <p className="mt-2 text-sm text-slate-100">{limitedBody}</p>
              {isOwner && (
                <div className="mt-3 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/upgrade"
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0"
                  >
                    Upgrade to Alpine Pro
                  </Link>
                </div>
              )}
            </div>
          )}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">About</h2>
              {artist.is_pro && <span className="text-xs uppercase tracking-[0.3em] text-emerald-300">PRO ARTIST</span>}
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="flex items-center gap-1">
                📧
                <span className={shouldBlur ? 'blur-sm select-none' : ''}>{artist.contact_email}</span>
              </span>
              {artist.website && (
                <span className="flex items-center gap-1">
                  🔗
                  <a
                    href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={shouldBlur ? 'blur-sm pointer-events-none select-none' : 'underline'}
                  >
                    {artist.website}
                  </a>
                </span>
              )}
            </div>
          </section>

          {(artist.embed_youtube || artist.embed_soundcloud || artist.embed_bandcamp) && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-2xl font-semibold text-white">Media &amp; Links</h2>
              <div className={`mt-4 space-y-6 ${shouldBlur ? 'blur-sm pointer-events-none select-none' : ''}`}>
                {artist.embed_youtube && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Video</h3>
                    <div className="mt-2 aspect-video overflow-hidden rounded-xl border border-slate-800">
                      <iframe src={artist.embed_youtube} className="h-full w-full" allowFullScreen />
                    </div>
                  </div>
                )}
                {artist.embed_soundcloud && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">SoundCloud</h3>
                    <ResponsiveMediaEmbed
                      provider="soundcloud"
                      src={artist.embed_soundcloud}
                      title={`${artist.display_name} SoundCloud`}
                    />
                  </div>
                )}
                {artist.embed_bandcamp && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Bandcamp</h3>
                    <ResponsiveMediaEmbed
                      provider="bandcamp"
                      src={artist.embed_bandcamp}
                      title={`${artist.display_name} Bandcamp`}
                    />
                  </div>
                )}
              </div>
              {shouldBlur && (
                <div className="mt-3 text-center text-xs text-slate-400">
                  {isOwner
                    ? "Media embeds stay hidden from fans until you upgrade to Alpine Pro."
                    : "This page’s media stays hidden until they upgrade to Alpine Pro."}
                  {isOwner && (
                    <>
                      {" "}
                      <Link href="/upgrade" className="text-emerald-300 underline">
                        Upgrade now
                      </Link>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {(artist.promo_photo || artist.stage_plot || artist.press_kit) && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-2xl font-semibold text-white">Downloads</h2>
              <div className={`mt-4 space-y-2 text-sm ${shouldBlur ? 'blur-sm pointer-events-none select-none' : ''}`}>
                {artist.promo_photo && (
                  <a href={artist.promo_photo} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">
                    📸 Promo Photo
                  </a>
                )}
                {artist.stage_plot && (
                  <a href={artist.stage_plot} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">
                    🎚️ Stage Plot
                  </a>
                )}
                {artist.press_kit && (
                  <a href={artist.press_kit} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">
                    📄 Press Kit
                  </a>
                )}
              </div>
              {shouldBlur && (
                <div className="mt-3 text-center text-xs text-slate-400">
                  {isOwner
                    ? "Downloads unlock for everyone once you upgrade to Alpine Pro."
                    : "Downloads are hidden because this page hasn’t upgraded to Alpine Pro yet."}
                  {isOwner && (
                    <>
                      {" "}
                      <Link href="/upgrade" className="text-emerald-300 underline">
                        Manage plan
                      </Link>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-2xl font-semibold text-white">Upcoming Shows</h2>
            <div className="mt-4">
              {artist.events && artist.events.length > 0 ? (
                <div className={shouldBlur ? 'relative blur-sm pointer-events-none select-none' : ''}>
                  {artist.events.map((event) => (
                    <Link
                      key={event.id}
                      href={`/eventRouter/${event.slug}`}
                      className="mb-4 flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 last:mb-0 transition hover:scale-[1.01] hover:border-emerald-400/60 hover:bg-slate-900"
                    >
                      <EventPoster
                        posterUrl={event.poster}
                        title={event.title}
                        className="h-16 w-16 flex-shrink-0 sm:h-20 sm:w-20"
                      />
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
                          {dayjs.utc(event.date).format('ddd, MMM D')}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">{event.title}</h3>
                        <p className="text-sm text-slate-300">
                          📍 {event.venue_name} • {event.location}
                        </p>
                        <p className="text-xs text-slate-400">🎵 {event.genre}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No upcoming events listed.</p>
              )}
              {shouldBlur && (
                <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-center text-sm text-slate-300">
                  {isOwner
                    ? "Your full calendar will appear here once you upgrade to Alpine Pro."
                    : "This page’s full calendar will appear once they upgrade to Alpine Pro."}
                  {isOwner && (
                    <>
                      {" "}
                      <Link href="/upgrade" className="text-emerald-300 underline">
                        Upgrade
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>

          {canEdit && (
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push(`/artists/edit/${artist.slug}`)}
                className="flex-1 rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-300 hover:text-white"
              >
                ✏️ Edit Profile
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:border-red-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                🗑️ Delete Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug as string;
  const cookie = context.req.headers.cookie || '';

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${slug}`, {
      headers: { cookie },
    });

    if (res.status === 403) {
      return {
        redirect: { destination: `/UserProfile?pending=true`, permanent: false },
      };
    }

    if (!res.ok) return { notFound: true };

    const artist = await res.json();
    return { props: { artist } };
  } catch (err) {
    console.error('GSSP /artists/[slug] error:', err);
    return { props: { artist: null } };
  }
};

export default ArtistProfilePage;
