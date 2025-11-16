import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { fetchEventDetails, getEvents } from '../api/route';
import Header from '@/components/Header';
import EventDetailCard from '@/components/EventDetailCard';
import WelcomeUser from '@/components/WelcomeUser';
import UpcomingShows from '@/components/UpcomingShows';
import LoginForm from '@/components/login';
import RegistrationForm from '@/components/registration';
import { Event } from '@/interfaces/interfaces';
import { useAuth } from '@/context/AuthContext';
import { FaFacebookF, FaTwitter, FaLink, FaLocationArrow, FaShareAlt } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { fetchEventDetailsBySlug } from '../api/route'; // or wherever you define it


interface Props {
  event: Event;
  events: Event[];
}

const EventDetailPage = ({ event, events }: Props) => {
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const router = useRouter();

  const switchAuthMode = () => {
    setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'));
  };

  const getDirections = () => {
    if (!event?.address) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <Head>
        <title>{event.title} | Alpine Groove Guide</title>
        <meta name="description" content={event.description?.slice(0, 150)} />
        <link rel="canonical" href={`https://app.alpinegrooveguide.com/eventRouter/${event.slug}`} />
      </Head>



      <div className="min-h-screen bg-gray-900 text-white font-sans">
        <Header />
        <div className="px-6 pt-2">
          <Link href="/" passHref>
            <span className="text-sm text-yellow-300 hover:underline">← Back to All Events</span>
          </Link>
        </div>
        <main className="container mx-auto p-6 lg:flex gap-8">
          <section className="flex-1">
            <EventDetailCard event={event} user={user} />
             {/* edit-button for owner or admin */}
            {user && (user.id === event.user_id || user.is_admin) && (
              <Link href={`/events/edit/${event.id}`} passHref>
                <button
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow"
                >
                  Edit Event
                </button>
              </Link>
            )}
            <div className="flex flex-wrap gap-3 mt-6 items-center">
              <button
                onClick={getDirections}
                className="bg-indigo-600 hover:bg-indigo-700 text-yellow-300 font-semibold px-4 py-2 rounded-md shadow transition transform hover:scale-105 flex items-center gap-2"
              >
                <FaLocationArrow /> Get Directions
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: event.title,
                      text: event.description?.slice(0, 100),
                      url: `https://app.alpinegrooveguide.com/share/${event.slug}`,
                    });
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-md shadow transition transform hover:scale-105 flex items-center gap-2"
              >
                <FaShareAlt /> Share This Event
              </button>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  `https://app.alpinegrooveguide.com/share/${event.slug}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow transition transform hover:scale-105 flex items-center gap-2"
              >
                <FaFacebookF /> Facebook
              </a>

              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  `https://app.alpinegrooveguide.com/share/${event.slug}`
                )}&text=${encodeURIComponent(event.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded-md shadow transition transform hover:scale-105 flex items-center gap-2"
              >
                <FaTwitter /> X
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://app.alpinegrooveguide.com/share/${event.slug}`);
                  alert('Link copied to clipboard!');
                }}
                className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded-md shadow transition transform hover:scale-105 flex items-center gap-2"
              >
                <FaLink /> Copy Link
              </button>
            </div>
          </section>

          <aside className="w-full lg:w-1/3 bg-white text-black p-6 rounded-lg shadow-lg mt-10 lg:mt-0">
            {user ? (
              <>
                <WelcomeUser />
                <UpcomingShows
                  user={user}
                  userGenres={
                    Array.isArray(user.top_music_genres)
                      ? user.top_music_genres
                      : JSON.parse(user.top_music_genres || '[]')
                  }
                  events={events}
                />
              </>
            ) : authMode === 'login' ? (
              <>
                <LoginForm setAuthMode={switchAuthMode} />
                <button onClick={switchAuthMode} className="mt-4 text-indigo-600 hover:text-indigo-800 transition">
                  Need an account? Register
                </button>
              </>
            ) : (
              <>
                <RegistrationForm setAuthMode={switchAuthMode} />
                <button onClick={switchAuthMode} className="mt-4 text-indigo-600 hover:text-indigo-800 transition">
                  Already have an account? Login
                </button>
              </>
            )}
          </aside>
        </main>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug;

  if (!slug || typeof slug !== 'string') {
    console.warn('Invalid or missing event slug:', slug);
    return { notFound: true };
  }

  try {
    const event = await fetchEventDetailsBySlug(slug);
    const allEvents = await getEvents();

    if (!event || typeof event.id !== 'number') {
      console.warn('Invalid event response');
      return { notFound: true };
    }

    return {
      props: {
        event,
        events: allEvents.filter((e: Event) => e.is_approved),
      },
    };
  } catch (err) {
    console.error('getServerSideProps failed:', err);
    return { notFound: true };
  }
};

export default EventDetailPage;
