import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import Header from '@/components/Header';
import LoginForm from '@/components/login';
import WelcomeUser from "@/components/WelcomeUser"; 
import RegistrationForm from '@/components/registration';
import { useAuth } from "@/context/AuthContext";
import Events from "../components/events";
import EventsCalendar from "@/components/EventsCalendar";
import { getEvents } from './api/route';
import { Event } from '@/interfaces/interfaces';
import isBetween from 'dayjs/plugin/isBetween';
import UpcomingShows from '@/components/UpcomingShows';

type AuthMode = 'login' | 'register';
dayjs.extend(isBetween)

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filterMode, setFilterMode] = useState<'day' | 'week' | 'all'>('day');

  const { user, logout } = useAuth();

  const switchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsData = await getEvents();
        const approvedEvents = eventsData
          .filter((activity: any) => activity.is_approved)
          .sort((a: any, b: any) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          });
        setEvents(approvedEvents);
      } catch (error) {
        console.error('Failed to load events', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const updateFilteredEvents = () => {
      let filtered :any  = [];
      if (filterMode === 'day') {
        filtered = events.filter((event) =>
          dayjs(event.date).isSame(selectedDate, 'day')
        );
      } else if (filterMode === 'week') {
        const startOfWeek = selectedDate.startOf('week');
        const endOfWeek = selectedDate.endOf('week');
        filtered = events.filter((event) =>
          dayjs(event.date).isBetween(startOfWeek, endOfWeek, null, '[]')
        );
      } else if (filterMode === 'all') {
        filtered = events;
      }
      setFilteredEvents(filtered);
    };
    updateFilteredEvents();
  }, [events, selectedDate, filterMode]);

  const handleDateSelect = (newDate: any) => {
    setSelectedDate(newDate);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterMode(event.target.value as 'day' | 'week' | 'all');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="flex flex-1 flex-col md:flex-row">
        <main className="flex-grow p-4 md:p-8">
          <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
            <section className="flex-grow">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl md:text-2xl font-bold">Events</h1>
                <select
                  name="event-pulldown"
                  id="event-pulldown"
                  value={filterMode}
                  onChange={handleFilterChange}
                  className="p-2 border rounded text-black"
                >
                  <option value="day">Today's Events</option>
                  <option value="week">This Week's Events</option>
                  <option value="all">All Upcoming Events</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Events events={filteredEvents} />
              </div>
            </section>
            <aside className="lg:w-1/3">
              <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <EventsCalendar currentDate={selectedDate} events={events} onDateSelect={handleDateSelect} />
              </div>
            </aside>
          </div>
        </main>
        <aside className="w-full md:w-1/5 flex flex-col bg-white p-4 shadow-lg text-black">
          {user ? (
            <>
              <WelcomeUser />
              <UpcomingShows user={user} userGenres={user.top_music_genres} events={events} />
            </>
          ) : (
            <>
              {authMode === 'login' ? (
                <>
                  <LoginForm />
                  <button onClick={() => setAuthMode('register')} className="mt-4 text-blue-500">
                    Need an account? Register
                  </button>
                </>
              ) : (
                <>
                  <RegistrationForm setAuthMode={switchAuthMode} />
                  <button onClick={() => setAuthMode('login')} className="mt-4 text-blue-500">
                    Already have an account? Login
                  </button>
                </>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
