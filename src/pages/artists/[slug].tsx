// pages/artists/[slug].tsx
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

interface Event {
  id: number;
  title: string;
  date: string;
  venue_name: string;
  location: string;
  genre: string;
}

interface Artist {
  id: number;
  display_name: string;
  user_id:number;
  bio: string;
  contact_email: string;
  profile_image: string;
  genres: string[];
  slug: string;
  events: Event[];
}

interface Props {
  artist: Artist | null;
}

const ArtistProfilePage = ({ artist }: Props) => {
  const { user } = useAuth();
  const canEdit = artist && user && (user.id === artist.user_id || user.is_admin);
  
  const router = useRouter();

  if (!artist) return <div className="text-white p-6">Artist not found</div>;

  return (
    <>
      <Head>
        <title>{artist.display_name} | Alpine Groove Guide</title>
        <meta name="description" content={`See upcoming gigs and learn more about ${artist.display_name}`} />
        <meta property="og:image" content={artist.profile_image} />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto space-y-6">
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
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
            {artist.events && artist.events.length > 0 ? (
              <ul className="space-y-4">
                {artist.events.map(event => (
                  <li key={event.id} className="bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-bold text-gold">{event.title}</h3>
                    <p className="text-gray-300">📅 {new Date(event.date).toLocaleDateString()}</p>
                    <p className="text-gray-400">📍 {event.venue_name} - {event.location}</p>
                    <p className="text-gray-400">🎵 {event.genre}</p>
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
