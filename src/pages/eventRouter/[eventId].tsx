import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { fetchEventDetails, getEvents } from '../api/route';
import Header from '@/components/Header';
import EventCard from '@/components/EventCard';
import WelcomeUser from '@/components/WelcomeUser';
import UpcomingShows from '@/components/UpcomingShows';
import LoginForm from '@/components/login';
import RegistrationForm from '@/components/registration';
import { Event } from '@/interfaces/interfaces';
import { useAuth } from '@/context/AuthContext';
import { FaFacebookF, FaTwitter, FaLink, FaLocationArrow, FaShareAlt } from 'react-icons/fa';


interface Props {
  event: Event;
  events: Event[];
}

const EventDetailPage = ({ event, events }: Props) => {
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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
        <meta property="og:title" content={event.title} />
        <meta
          property="og:description"
          content={event.description?.slice(0, 150) || 'Discover live music across Colorado with Alpine Groove Guide.'}
        />
        <meta
          property="og:image"
          content={
            event.poster?.startsWith('http')
              ? event.poster
              : 'https://app.alpinegrooveguide.com/alpine_groove_guide_icon.png'
          }
        />
        <meta
          property="og:url"
          content={`https://app.alpinegrooveguide.com/eventRouter/${event.id}`}
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta
          name="twitter:description"
          content={event.description?.slice(0, 150) || 'Discover live music across Colorado with Alpine Groove Guide.'}
        />
        <meta
          name="twitter:image"
          content={
            event.poster?.startsWith('http')
              ? event.poster
              : 'https://app.alpinegrooveguide.com/alpine_groove_guide_icon.png'
          }
        />
        <link
          rel="canonical"
          href={`https://app.alpinegrooveguide.com/eventRouter/${event.id}`}
        />
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
            <EventCard event={event} />
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
                      url: `https://app.alpinegrooveguide.com/eventRouter/${event.id}`,
                    });
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-md shadow transition transform hover:scale-105 flex items-center gap-2"
              >
                <FaShareAlt /> Share This Event
              </button>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  `https://app.alpinegrooveguide.com/eventRouter/${event.id}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow transition transform hover:scale-105 flex items-center gap-2"
              >
                <FaFacebookF /> Facebook
              </a>

              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  `https://app.alpinegrooveguide.com/eventRouter/${event.id}`
                )}&text=${encodeURIComponent(event.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded-md shadow transition transform hover:scale-105 flex items-center gap-2"
              >
                <FaTwitter /> X
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://app.alpinegrooveguide.com/eventRouter/${event.id}`);
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
  const id = Number(context.params?.eventId);

  try {
    const [event, events] = await Promise.all([
      fetchEventDetails(id),
      getEvents().then((all: Event[]) =>
        all.filter((e: Event) => e.is_approved)
      ),
    ]);

    return {
      props: {
        event,
        events,
      },
    };
  } catch (err) {
    console.error('Error in getServerSideProps:', err);
    return {
      notFound: true,
    };
  }
};

export default EventDetailPage;
