// pages/artists/[slug].tsx
import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Link from 'next/link';

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
  events: Event[]
  trial_expired?: boolean;
}

interface Props {
  artist: Artist | null;
}

const ArtistProfilePage = ({ artist }: Props) => {
  const { user } = useAuth();
  const canEdit = artist && user && (user.id === artist.user_id || user.is_admin);
  const router = useRouter();
  const [showTrialToast, setShowTrialToast] = useState(false);

useEffect(() => {
  if (router.query.trial === 'active') {
    setShowTrialToast(true);
    setTimeout(() => setShowTrialToast(false), 5000); // Hide after 5 seconds
  }
}, [router.query]);


  if (!artist) return <div className="text-white p-6">Artist not found</div>;

  if (artist.trial_expired && !artist.is_pro) {
    
    return (
      <div className="text-white p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{artist.display_name}</h1>
        <Image
          src={artist.profile_image}
          alt={artist.display_name}
          width={192}
          height={192}
          className="rounded-full shadow mb-4"
        />
        <p className="mb-4">
          Your free trial has expired. To unlock full access to your artist profile (bio, contact, media, and downloads),
          please upgrade to Alpine Pro.
        </p>
        <Link href="/upgrade">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Upgrade to Pro
          </button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{artist.display_name} | Alpine Groove Guide</title>
        <meta name="description" content={`See upcoming gigs and learn more about ${artist.display_name}`} />
        <meta property="og:image" content={artist.profile_image} />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {showTrialToast && (
            <div className="bg-green-600 text-white text-sm rounded p-2 mb-4 text-center shadow-md">
              ✅ Welcome! Your 30-day free trial of Alpine Pro is active.
            </div>
          )}
          <Header />
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
              <p className="text-sm text-gray-400">📧 {artist.contact_email}</p>
              <p className="text-sm text-gray-400">🎶 {artist.genres.join(', ')}</p>
              {artist.website && <p className="text-sm text-blue-400">🔗 <a
                href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                {artist.website}
              </a></p>}
            </div>
          </div>

          {(artist.embed_youtube || artist.embed_soundcloud || artist.embed_bandcamp) && (
            <div className="space-y-6">
              {artist.embed_youtube && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">📺 Video</h3>
                  <div className="aspect-video">
                    <iframe src={artist.embed_youtube} className="w-full h-full" allowFullScreen></iframe>
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
                  <iframe style={{ border: 0 }} src={artist.embed_bandcamp} width="100%" height="120" allow="autoplay"></iframe>
                </div>
              )}
            </div>
          )}

          {(artist.promo_photo || artist.stage_plot || artist.press_kit) && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mt-6">📎 Downloads</h3>
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
          )}

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
            {artist.events && artist.events.length > 0 ? (
              <ul className="space-y-4">
                {artist.events.map(event => (
                  <li key={event.id} className="bg-gray-800 p-4 rounded-lg shadow hover:bg-gray-700 transition">
                    <Link href={`/eventRouter/${event.slug}`} className="block cursor-pointer">
                      <h3 className="text-lg font-bold text-gold">{event.title}</h3>
                      <p className="text-gray-300">📅 {new Date(event.date).toLocaleDateString()}</p>
                      <p className="text-gray-400">📍 {event.venue_name} - {event.location}</p>
                      <p className="text-gray-400">🎵 {event.genre}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No upcoming events listed.</p>
            )}

            {canEdit && (
              <button
                onClick={() => router.push(`/artists/edit/${artist.slug}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-4"
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${slug}`);
    const artist = await res.json();

    if (!res.ok || !artist) {
      return { notFound: true };
    }

    return { props: { artist } };
  } catch (err) {
    console.error('Error fetching artist:', err);
    return { props: { artist: null } };
  }
};

export default ArtistProfilePage;
