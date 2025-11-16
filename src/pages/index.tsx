import React, { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import Image from 'next/image';
import { Switch } from '@headlessui/react';
import { Search, CalendarSearch } from 'lucide-react';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import LoginForm from '@/components/login';
import RegistrationForm from '@/components/registration';
import WelcomeUser from '@/components/WelcomeUser';
import EventsCalendar from '@/components/EventsCalendar';
import UpcomingShows from '@/components/UpcomingShows';
import { useAuth } from '@/context/AuthContext';
import { useHomeState } from '@/hooks/useHomeState';
import { getEvents } from './api/route';
import { Event } from '@/interfaces/interfaces';
import { parseMSTDate, parseLocalDayjs } from '@/util/dateHelper';
import EventCard from '@/components/EventCard';

import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type AuthMode = 'login' | 'register';

export default function Home() {
  const {
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
  } = useHomeState();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchAllUpcoming, setSearchAllUpcoming] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('searchAllUpcoming') === 'true';
    }
    return false;
  });
  const [showHero, setShowHero] = useState(true);

  useEffect(() => {
    const lastVisit = localStorage.getItem('lastVisitDate');
    const today = dayjs().format('YYYY-MM-DD');

    if (lastVisit === today) {
      setShowHero(false);
    } else {
      localStorage.setItem('lastVisitDate', today);
      setShowHero(true);
    }
  }, []);

  const resultsRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  const switchAuthMode = () =>
    setAuthMode((m) => (m === 'login' ? 'register' : 'login'));

  useEffect(() => {
    (async () => {
      try {
        const data = await getEvents();
        const approved = data
          .filter((e: any) => e.is_approved)
          .sort((a: any, b: any) =>
            parseMSTDate(a.date).getTime() - parseMSTDate(b.date).getTime()
          );
        setEvents(approved);
      } catch (err) {
        console.error('Failed to load events', err);
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem('searchAllUpcoming', String(searchAllUpcoming));

    const today = dayjs().startOf('day');
    let targetEvents = searchAllUpcoming
      ? events.filter((e) => parseLocalDayjs(e.date).isSameOrAfter(today))
      : events.filter((e) => parseLocalDayjs(e.date).isSame(selectedDate, 'day'));

    if (searchQuery.trim()) {
      const fuse = new Fuse(targetEvents, {
        keys: ['title', 'genre', 'venue_name', 'description'],
        threshold: 0.3,
      });
      targetEvents = fuse.search(searchQuery).map((r) => r.item);
    }

    setFilteredEvents(targetEvents);

    if (searchAllUpcoming && searchQuery && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, selectedDate, searchQuery, searchAllUpcoming]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white font-sans">
      {showHero && (
        <div className="animate-fadeIn transition-opacity duration-700 ease-in-out">
          <HeroSection user={user} setAuthMode={switchAuthMode} />
        </div>
      )}

      <div className="text-center py-6 px-4 md:px-0">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gold drop-shadow-md">
          Welcome to Alpine Groove Guide
        </h2>
        <p className="text-gray-300 mt-2 max-w-xl mx-auto text-base md:text-lg">
          Discover the best live music happening across Colorado Springs and beyond.
        </p>
      </div>

      {user?.is_admin && (
        <div className="px-4 py-6 max-w-5xl mx-auto">
          <div className="mt-6 bg-gray-800 text-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <h3 className="text-lg font-bold mb-2 text-yellow-300">🧑‍🎤 Artist Directory (Admin Preview)</h3>
            <p className="text-sm text-gray-300 mb-4">
              Preview and test Alpine Pro artist pages before they go live to the public.
            </p>
            <Link href="/artists">
              <a className="inline-block px-4 py-2 bg-yellow-500 text-black rounded font-semibold hover:bg-yellow-400">
                View Directory
              </a>
            </Link>
          </div>
        </div>
      )}


      <div className="flex flex-1 flex-col md:flex-row gap-4 px-2 sm:px-4 lg:px-8">
        <main className="container mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col gap-6">
            <aside className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-5 rounded-xl shadow-lg border border-gray-700">
              <EventsCalendar
                currentDate={selectedDate}
                events={events}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setSearchQuery('');
                  setSearchAllUpcoming(false);
                }}
              />
            </aside>

            <section id="events" className="flex-grow scroll-mt-20" ref={resultsRef}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Events</h1>
                <div className="flex flex-col md:flex-row gap-2 md:items-center w-full md:w-auto">
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      placeholder="Search by title, genre, artist, or venue..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-3 pl-10 border border-gray-600 rounded-md text-black bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={searchAllUpcoming}
                      onChange={setSearchAllUpcoming}
                      className={classNames(
                        searchAllUpcoming ? 'bg-blue-600' : 'bg-gray-600',
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none'
                      )}
                    >
                      <span
                        className={classNames(
                          searchAllUpcoming ? 'translate-x-6' : 'translate-x-1',
                          'inline-block h-4 w-4 transform bg-white rounded-full transition-transform duration-200'
                        )}
                      />
                    </Switch>
                    <span className="text-sm text-gray-300 flex items-center gap-1">
                      <CalendarSearch className="w-4 h-4" /> All Upcoming
                    </span>
                  </div>
                </div>
              </div>

              {searchAllUpcoming && searchQuery && (
                <p className="text-xs text-gray-400 italic mb-4">
                  Showing search results across all approved upcoming events.
                </p>
              )}

              <div
                className={classNames(
                  "transition-opacity duration-500",
                  searchAllUpcoming && searchQuery ? "opacity-100" : "opacity-90"
                )}
              >
                {filteredEvents.length ? (
                  <section className="mx-auto max-w-6xl px-0 pb-10">
                    <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-50">
                          Live Music Calendar
                        </h2>
                        <p className="text-sm text-slate-400">
                          Discover shows across Colorado Springs and the Front Range.
                        </p>
                      </div>
                    </header>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {filteredEvents.map((event) => {
                        const startTimeISO = event.start_time
                          ? `${event.date}T${event.start_time}`
                          : event.date;
                        return (
                          <EventCard
                            key={event.id}
                            title={event.title}
                            slug={event.slug}
                            startTime={startTimeISO}
                            city={event.location || undefined}
                            venueName={event.venue_name}
                            imageUrl={event.poster || undefined}
                            isFeatured={(event as any).is_featured}
                          />
                        );
                      })}
                    </div>
                  </section>
                ) : (
                  <div className="text-center mt-12 flex flex-col items-center gap-6">
                    <Image
                      src="/alpine_groove_guide_icon.png"
                      alt="Alpine Groove Logo"
                      width={180}
                      height={180}
                      className="opacity-80 animate-pulse"
                    />
                    <p className="text-gray-400 text-lg font-medium">
                      🥺 No events to display.
                      <br className="hidden sm:inline" />
                      Try adjusting your search or clicking another date!
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>

        <aside
          id="auth-section"
          className="w-full md:w-[40%] lg:w-[30%] xl:w-1/4 max-w-md bg-white p-6 shadow-xl text-black rounded-lg overflow-auto"
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
          ) : authMode === 'login' ? (
            <LoginForm setAuthMode={switchAuthMode} />
          ) : (
            <RegistrationForm setAuthMode={switchAuthMode} />
          )}
        </aside>
      </div>
    </div>
  );
}
