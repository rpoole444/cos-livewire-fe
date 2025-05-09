import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import EventCard from '../../components/EventCard';
import { fetchEventDetails } from '../api/route';
import { useAuth } from "../../context/AuthContext";
import LoginForm from '@/components/login';
import WelcomeUser from "@/components/WelcomeUser";
import RegistrationForm from '@/components/registration';
import Link from "next/link";
import { Event } from '@/interfaces/interfaces';
import Header from '@/components/Header';
type AuthMode = 'login' | 'register';

const EventDetailPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { eventId } = router.query;
  const [event, setEvent] = useState<Event | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const switchAuthMode = () => {
    setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'));
  };

  useEffect(() => {
    const fetchSingleEvent = async () => {
      const id = Number(Array.isArray(eventId) ? eventId[0] : eventId);
      if (id) {
        try {
          const data = await fetchEventDetails(id);
          setEvent(data);
        } catch (error) {
          console.error('Failed to fetch event details:', error);
        }
      }
    };
    if (eventId) fetchSingleEvent();
  }, [eventId]);

  const getDirections = () => {
    if (!event?.address) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address)}`;
    window.open(url, '_blank');
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p className="text-lg">Loading event details...</p>
      </div>
    );
  }

  return (
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
            <Link href="/" passHref>
              <button className="text-indigo-400 hover:text-indigo-600 font-medium underline transition">
                Back to All Events
              </button>
            </Link>
          </div>
        </section>

        <aside className="w-full lg:w-1/3 bg-white text-black p-6 rounded-lg shadow-lg mt-10 lg:mt-0">
          {user ? (
            <WelcomeUser />
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
  );
};

export default EventDetailPage;
