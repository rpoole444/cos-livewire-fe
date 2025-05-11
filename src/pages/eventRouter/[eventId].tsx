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
        <main className="container mx-auto p-6 lg:flex gap-8">
          <section className="flex-1">
            <EventCard event={event} />
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={getDirections}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition"
              >
                Get Directions
              </button>

              <Link href="/">
                <button className="text-indigo-400 hover:text-indigo-600 font-medium underline transition">
                  Back to All Events
                </button>
              </Link>
              <button
                onClick={() => {
                  const shareData = {
                    title: event.title,
                    text: `Check out this show: ${event.title}`,
                    url: `https://app.alpinegrooveguide.com/eventRouter/${event.id}`,
                  };

                  if (navigator.share) {
                    navigator.share(shareData).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(shareData.url).then(() => {
                      alert('Link copied to clipboard!');
                    });
                  }
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-4 rounded transition"
              >
                📤 Share This Event
              </button>
              <div className="flex gap-4 mt-4">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    `https://app.alpinegrooveguide.com/eventRouter/${event.id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                >
                  Share on Facebook
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    `https://app.alpinegrooveguide.com/eventRouter/${event.id}`
                  )}&text=${encodeURIComponent(event.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded text-sm"
                >
                  Share on X
                </a>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://app.alpinegrooveguide.com/eventRouter/${event.id}`);
                    alert('Link copied to clipboard!');
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                >
                  Copy Link
                </button>
</div>

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
