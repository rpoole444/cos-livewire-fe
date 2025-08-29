// pages/artists/[slug].tsx
import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Link from 'next/link';
import TrialBanner from '@/components/TrialBanner'; // adjust path as needed
import { FaFacebookF, FaTwitter, FaLink, FaShareAlt } from 'react-icons/fa';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);


interface Event {
  id: number;
  title: string;
  date: string;
  venue_name: string;
  location: string;
  genre: string;
  slug: string;
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
  is_approved?: boolean
}

interface Props {
  artist: Artist | null;
}

const ArtistProfilePage = ({ artist }: Props) => {
  const { user } = useAuth();
  const canEdit = artist && user && (user.id === artist.user_id || user.is_admin);
  const router = useRouter();
  const isPending = router.query.pending === 'true';
  const isOwner = user?.id === artist?.user_id;
  const showPendingBanner =
    isPending && isOwner && artist && artist.is_approved === false;
  const [showTrialToast, setShowTrialToast] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isProfileOwner = user?.id === artist?.user_id;
  const isTrialExpired = artist?.trial_ends_at ? dayjs().isAfter(dayjs(artist.trial_ends_at), 'day') : true;

  useEffect(() => {
    if (artist) {
      console.log('Loaded artist:', artist);
    }
  }, [artist]);
  

  useEffect(() => {
    if (router.query.trial === 'active') {
      setShowTrialToast(true);
      setTimeout(() => setShowTrialToast(false), 5000);
    }
  }, [router.query]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this artist profile?')) return;

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

  if (!artist) return <div className="text-white p-6">Artist not found</div>;

  const shouldBlur =
  !artist.is_pro &&
  (isTrialExpired || !artist.trial_ends_at); // Applies to both owner and public view

  return (
    <>
      <Head>
        <title>{artist.display_name} | Alpine Groove Guide</title>
        <meta name="description" content={artist.bio?.slice(0, 150)} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Alpine Groove Guide" />
        <meta property="og:title" content={`${artist.display_name} | Alpine Groove Guide`} />
        <meta property="og:description" content={artist.bio?.slice(0, 150)} />
        <meta
          property="og:image"
          content={
            artist.profile_image.startsWith('http')
              ? artist.profile_image
              : `https://app.alpinegrooveguide.com${artist.profile_image}`
          }
        />        
        <meta property="og:url" content={`https://app.alpinegrooveguide.com/artists/${artist.slug}`} />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${artist.display_name} | Alpine Groove Guide`} />
        <meta name="twitter:description" content={artist.bio?.slice(0, 150)} />
        <meta
          name="twitter:image"
          content={
            artist.profile_image.startsWith('http')
              ? artist.profile_image
              : `https://app.alpinegrooveguide.com${artist.profile_image}`
          }
        />
      </Head>
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {showPendingBanner && (
            <div className="bg-yellow-400 text-black text-sm rounded p-3 shadow text-center font-medium">
              ⏳ Your artist profile is currently <strong>pending admin approval</strong>. You’ll be notified when approved.
            </div>
            )}
            {showTrialToast && isOwner && (
              <div className="bg-green-600 text-white text-sm rounded p-2 mb-4 text-center shadow-md">
                ✅ Welcome! Your 30-day free trial of Alpine Pro is active.
              </div>
            )}
            {!isOwner && !artist.is_pro && isTrialExpired && (
              <div className="bg-gray-800 text-blue-300 text-sm rounded p-3 shadow text-center">
                📣 This artist’s Alpine Pro trial has ended.{' '}
                <Link href="/upgrade" className="underline hover:text-blue-400">
                  Learn more about upgrading to Pro
                </Link>
                .
              </div>
            )}

          <Header />
          <TrialBanner artist_user_id={artist.user_id} trial_ends_at={artist.trial_ends_at} is_pro={artist.is_pro} />
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <Image
              src={artist.profile_image}
              alt={artist.display_name}
              width={192}
              height={192}
              className="rounded-full shadow"
            />
            <div>
              <h1 className="text-4xl font-bold mb-2">{artist.display_name}</h1>
              <p className="text-gray-300 mb-2">{artist.bio}</p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-400">
                  📧
                  <div className={shouldBlur ? 'ml-1 blur-sm pointer-events-none select-none' : 'ml-1'}>
                    {artist.contact_email}
                  </div>
                </div>

                {artist.tip_jar_url && (
                  <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-green-500">
                    <h3 className="text-lg font-bold mb-2 text-green-400">Support this artist 🎺</h3>
                    <div className={shouldBlur ? 'blur-sm pointer-events-none select-none' : ''}>
                      <p className="text-gray-300 text-sm mb-4">
                        Enjoying the music? Send a tip directly to support their work.
                      </p>

                      <a
                        href={artist.tip_jar_url.startsWith('http') ? artist.tip_jar_url : `https://${artist.tip_jar_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-green-600 hover:bg-green-700 hover:scale-105 transform transition text-white px-5 py-2 text-lg font-semibold rounded shadow"
                      >
                        💸 Tip this artist
                      </a>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-400">🎶 {artist.genres.join(', ')}</p>

                {artist.website && (
                  <div className="flex items-center text-sm text-blue-400">
                    🔗
                    <a
                      href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={shouldBlur ? 'ml-1 underline blur-sm pointer-events-none select-none' : 'ml-1 underline'}
                    >
                      {artist.website}
                    </a>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: artist.display_name,
                        url: `https://app.alpinegrooveguide.com/share/artist/${artist.slug}`,
                      });
                    }
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded shadow flex items-center gap-1"
                >
                  <FaShareAlt /> Share
                </button>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    `https://app.alpinegrooveguide.com/share/artist/${artist.slug}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded shadow flex items-center gap-1"
                >
                  <FaFacebookF /> Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    `https://app.alpinegrooveguide.com/share/artist/${artist.slug}`
                  )}&text=${encodeURIComponent(artist.display_name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1 rounded shadow flex items-center gap-1"
                >
                  <FaTwitter /> X
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://app.alpinegrooveguide.com/share/artist/${artist.slug}`
                    );
                    alert('Link copied to clipboard!');
                  }}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded shadow flex items-center gap-1"
                >
                  <FaLink /> Copy Link
                </button>
              </div>
            </div>
          </div>

          {(artist.embed_youtube || artist.embed_soundcloud || artist.embed_bandcamp) && (
            <div className="space-y-6">
              <div className={shouldBlur ? 'relative blur-sm pointer-events-none select-none' : ''}>
                {artist.embed_youtube && (
                  <div>
                    <h3 className="text-xl font-semibold mb-2">📺 Video</h3>
                    <div className="aspect-video">
                      <iframe src={artist.embed_youtube} className="w-full h-full" allowFullScreen />
                    </div>
                  </div>
                )}
                {artist.embed_soundcloud && (
                  <div>
                    <h3 className="text-xl font-semibold mb-2">🎧 SoundCloud</h3>
                    <iframe width="100%" height="166" scrolling="no" frameBorder="no" allow="autoplay" src={artist.embed_soundcloud}></iframe>
                  </div>
                )}
                {artist.embed_bandcamp && (
                  <div>
                    <h3 className="text-xl font-semibold mb-2">🎵 Bandcamp</h3>
                    <iframe style={{ border: 0 }} src={artist.embed_bandcamp} width="100%" height="120" allow="autoplay" />
                  </div>
                )}
              </div>

              {shouldBlur && (
                <div className="mt-2 text-center text-sm text-gray-400 italic">
                  🔒 This artist’s media content is available with Alpine Pro.{' '}
                  <Link href="/upgrade" className="text-blue-400 underline">Learn more</Link>
                </div>
              )}
            </div>
          )}


          {(artist.promo_photo || artist.stage_plot || artist.press_kit) && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mt-6">📎 Downloads</h3>
              <div className={shouldBlur ? 'relative blur-sm pointer-events-none select-none' : ''}>
                {artist.promo_photo && (
                  <p><a href={artist.promo_photo} target="_blank" className="text-blue-400 underline">📸 Promo Photo</a></p>
                )}
                {artist.stage_plot && (
                  <p><a href={artist.stage_plot} target="_blank" className="text-blue-400 underline">🎚️ Stage Plot</a></p>
                )}
                {artist.press_kit && (
                  <p><a href={artist.press_kit} target="_blank" className="text-blue-400 underline">📄 Press Kit</a></p>
                )}
              </div>
              {shouldBlur && (
                <div className="mt-2 text-center text-sm text-gray-400 italic">
                  🔒 Downloadable content is only available for Pro artists.{' '}
                  <Link href="/upgrade" className="text-blue-400 underline">Learn more</Link>
                </div>
              )}
            </div>
          )}


          {shouldBlur ? (
            <div className="mt-8 bg-gray-800 p-6 rounded-lg blur-sm relative">
              <div className="absolute inset-0 bg-black/40 rounded-lg z-10 flex flex-col items-center justify-center text-center p-6">
                <p className="text-white text-lg font-semibold">
                  🎟️ Upgrade to Alpine Pro to see this artist’s upcoming events.
                </p>
                <Link href="/upgrade" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                  Learn More
                </Link>
              </div>
              {/* The blurred content underneath */}
              <div className="opacity-30 pointer-events-none">
                <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
                {artist.events && artist.events.length > 0 ? (
                  <ul className="space-y-4">
                    {artist.events.map(event => (
                      <li key={event.id} className="bg-gray-800 p-4 rounded-lg shadow hover:bg-gray-700 transition">
                        <Link href={`/eventRouter/${event.slug}`} className="block cursor-pointer">
                          <h3 className="text-lg font-bold text-gold">{event.title}</h3>
                          <p className="text-gray-300">📅 {dayjs.utc(event.date).format('MMMM D, YYYY')}</p>
                          <p className="text-gray-400">📍 {event.venue_name} - {event.location}</p>
                          <p className="text-gray-400">🎵 {event.genre}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No upcoming events listed.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
              {artist.events && artist.events.length > 0 ? (
                <ul className="space-y-4">
                  {artist.events.map(event => (
                    <li key={event.id} className="bg-gray-800 p-4 rounded-lg shadow hover:bg-gray-700 transition">
                      <Link href={`/eventRouter/${event.slug}`} className="block cursor-pointer">
                        <h3 className="text-lg font-bold text-gold">{event.title}</h3>
                        <p className="text-gray-300">📅 {dayjs.utc(event.date).format('MMMM D, YYYY')}</p>
                        <p className="text-gray-400">📍 {event.venue_name} - {event.location}</p>
                        <p className="text-gray-400">🎵 {event.genre}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No upcoming events listed.</p>
              )}
            </div>
          )}

            {canEdit && (
              <div className="flex flex-wrap gap-4 mt-6">
                <button
                  onClick={() => router.push(`/artists/edit/${artist.slug}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  ✏️ Edit Profile
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
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
      // Forward the user’s browser cookies so the API can identify the owner/admin
      headers: { cookie },
      // credentials has no effect on Node fetch, but leaving it is fine
    });

    // If API says “pending / forbidden” (owner not visible because cookie missing),
    // punt the user back to their profile where we show the “Pending approval” UI.
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