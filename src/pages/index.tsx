import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import Header from '@/components/Header';
import LoginForm from '@/components/login';
import HeroSection from '@/components/HeroSection';
import WelcomeUser from "@/components/WelcomeUser"; 
import RegistrationForm from '@/components/registration';
import { useAuth } from "@/context/AuthContext";
import Events from "../components/events";
import EventsCalendar from "@/components/EventsCalendar";
import { getEvents } from './api/route';
import { Event } from '@/interfaces/interfaces';
import isBetween from 'dayjs/plugin/isBetween';
import UpcomingShows from '@/components/UpcomingShows';
import { parseMSTDate, parseLocalDayjs } from '@/util/dateHelper';
import Fuse from 'fuse.js';
import Image from 'next/image';

type AuthMode = 'login' | 'register';
dayjs.extend(isBetween);

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filterMode, setFilterMode] = useState<'day' | 'week' | 'all'>('day');
  const [searchQuery, setSearchQuery] = useState('');

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
            const dateA = parseMSTDate(a.date);
            const dateB = parseMSTDate(b.date);
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
    let filtered: Event[] = [];

    if (filterMode === 'day') {
      filtered = events.filter((event) =>
        parseLocalDayjs(event.date).isSame(selectedDate, 'day')
      );
    } else if (filterMode === 'week') {
      const startOfWeek = selectedDate.startOf('week');
      const endOfWeek = selectedDate.endOf('week');
      filtered = events.filter((event) =>
        parseLocalDayjs(event.date).isBetween(startOfWeek, endOfWeek, null, '[]')
      );
    } else if (filterMode === 'all') {
      const now = dayjs().startOf('day');
      filtered = events.filter(event =>
        parseLocalDayjs(event.date).isSame(now, 'day') ||
        parseLocalDayjs(event.date).isAfter(now)
      );
    }

    if (searchQuery.trim() !== '') {
      const fuse = new Fuse(filtered, {
        keys: ['title', 'genre', 'venue_name', 'description'],
        threshold: 0.3, // Adjust for strictness
      });

      const results = fuse.search(searchQuery);
      const matchedEvents = results.map(result => result.item);

      setFilteredEvents(matchedEvents);
    } else {
      setFilteredEvents(filtered);
    }
  };

  updateFilteredEvents();
}, [events, selectedDate, filterMode, searchQuery]);


  const handleDateSelect = (newDate: any) => {
    setSelectedDate(newDate);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterMode(event.target.value as 'day' | 'week' | 'all');
  };

return (
  <div className="flex flex-col min-h-screen bg-gray-900 text-white font-sans">
    <Header />
    <HeroSection user={user} setAuthMode={switchAuthMode} />

    <div className="flex flex-1 flex-col md:flex-row gap-4 px-2 sm:px-4 lg:px-8">
      <main className="flex-grow p-4 md:p-8">
        <div className="flex flex-col-reverse lg:flex-row gap-4 md:gap-8">
          {/* Calendar comes first on mobile */}
          <aside className="order-1 lg:order-2 w-full lg:w-[35%] bg-gray-800 p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out">
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
              {filterMode === 'all' && (
                <p className="text-yellow-300 text-sm mb-2 border border-yellow-300 p-2 rounded bg-yellow-100/10">
                  📌 The calendar is disabled in &quot;All Upcoming Events&quot; mode. To access the calendar, please select &quot;Today&apos;s Events&quot; or &quot;This Week’s Events&quot; from the dropdown.
                </p>
              )}
              <div className={filterMode === 'all' ? 'pointer-events-none opacity-50' : ''}>
                <EventsCalendar
                  currentDate={selectedDate}
                  events={events}
                  onDateSelect={handleDateSelect}
                  filterMode={filterMode}
                />
              </div>

            </div>
          </aside>

          {/* Events list */}
            <section id="events" className="flex-grow scroll-mt-20">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h1 className="text-2xl md:text-3xl font-bold">Events</h1>
                <select
                  name="event-pulldown"
                  id="event-pulldown"
                  value={filterMode}
                  onChange={handleFilterChange}
                  className="p-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="day">Today&apos;s Events</option>
                  <option value="week">This Week&apos;s Events</option>
                  <option value="all">All Upcoming Events</option>
                </select>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by title, genre, artist, or venue..."
                  className="w-full p-2 border border-gray-300 rounded-md text-black"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            {filteredEvents.length > 0 ? (
              <Events events={filteredEvents} />
            ) : (
              <div className="text-center mt-10 flex flex-col items-center gap-4">
                <Image
                  src="/alpine_groove_guide_icon.png"
                  alt="Alpine Groove Logo"
                  width={200}
                  height={200}
                  className="opacity-80 animate-pulse"
                />
                <p className="text-gray-400 text-lg font-medium">
                  🥺 No events to display. Try adjusting your search or date filter!
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Auth + Upcoming */}
      <aside
        id="auth-section"
        className="w-full md:w-[40%] lg:w-[30%] xl:w-1/4 max-w-md bg-white p-6 shadow-xl text-black rounded-lg transition-all duration-300 ease-in-out overflow-auto"
      >
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
        ) : (
          <>
            {authMode === 'login' ? (
              <LoginForm setAuthMode={switchAuthMode} />
            ) : (
              <RegistrationForm setAuthMode={switchAuthMode} />
            )}
          </>
        )}
      </aside>
    </div>
  </div>
);

}
