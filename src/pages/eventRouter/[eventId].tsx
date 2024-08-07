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
type AuthMode = 'login' | 'register';
import { CustomEvent } from '@/interfaces/interfaces';

const EventDetailPage = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { eventId } = router.query;
  const [event, setEvent] = useState<Event>();
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const switchAuthMode = () => {
    setAuthMode(prevMode => (prevMode === 'login' ? 'register' : 'login'));
  };


  useEffect(() => {
    const fetchSingleEvent = async () => {
      const id = Number(Array.isArray(eventId) ? eventId[0] : eventId);
      if (id) {
        const data = await fetchEventDetails(id);
        setEvent(data);
      }
    };

    if (eventId) {
      fetchSingleEvent();
    }
  }, [eventId]);

  if (!event) {
    return <div>Loading...</div>;
  }

  const getDirections = ():any => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="w-full bg-indigo-800 text-white p-6">
        <h1 className="text-center text-4xl lg:text-5xl font-bold tracking-tight">
          Alpine Groove Guide
        </h1>
      </header>
      <div className="container mx-auto my-8 p-4 flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <EventCard event={event} />
          <button 
            onClick={getDirections}
            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-4"
          >
            Get Directions
          </button>
          <Link href="/" passHref>
            <button className="ml-4 mt-4 text-indigo-600 hover:text-indigo-800 transition duration-300 ease-in-out">
              Back to All Events
            </button>
          </Link>
        </div>
        <aside className="w-full lg:w-1/4 bg-white p-4 shadow-lg rounded">
          {user ? (
            <WelcomeUser />
          ) : (
            <>
              {authMode === 'login' ? (
                <div>
                  <LoginForm />
                  <button onClick={switchAuthMode} className="mt-4 text-indigo-600 hover:text-indigo-800 transition duration-300 ease-in-out">
                    Need an account? Register
                  </button>
                </div>
              ) : (
                <div>
                  <RegistrationForm setAuthMode={switchAuthMode} />
                  <button onClick={switchAuthMode} className="mt-4 text-indigo-600 hover:text-indigo-800 transition duration-300 ease-in-out">
                    Already have an account? Login
                  </button>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default EventDetailPage;
