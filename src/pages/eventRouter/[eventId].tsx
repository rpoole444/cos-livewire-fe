// src/pages/events/[eventId].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import EventCard from '../../components/EventCard';
import { fetchEventDetails } from '../api/route';
import { useAuth } from "../../context/AuthContext";
import LoginForm from '@/components/login';
import WelcomeUser from "@/components/WelcomeUser"; 
import RegistrationForm from '@/components/registration';
import Link from "next/link";

type AuthMode = 'login' | 'register';
const EventDetailPage = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { eventId } = router.query;
  const [event, setEvent] = useState(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  const switchAuthMode = () => {
    setAuthMode(prevMode => (prevMode === 'login' ? 'register' : 'login'));
  };

  console.log(eventId)
  useEffect(() => {
    const fetchSingleEvent = async () => {
      // Ensure eventId is a string and not an array, then convert to a number
      const id = Array.isArray(eventId) ? eventId[0] : eventId;
      const numericId = id ? parseInt(id, 10) : null;

      if (numericId) {
        const data: any = await fetchEventDetails(numericId);
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
console.log(event)
  // You can use the EventCard component or create a new one specifically for this page
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
      <Link href="/" passHref>
        <button className="mt-4 text-indigo-600 hover:text-indigo-800 transition duration-300 ease-in-out">
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
                <RegistrationForm setAuthMode={switchAuthMode}/>
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
