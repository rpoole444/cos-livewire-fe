import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import Fuse from 'fuse.js';
import Image from 'next/image';

import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import LoginForm from '@/components/login';
import RegistrationForm from '@/components/registration';
import WelcomeUser from '@/components/WelcomeUser';
import EventsCalendar from '@/components/EventsCalendar';
import Events from '@/components/events';
import UpcomingShows from '@/components/UpcomingShows';

import { useAuth } from '@/context/AuthContext';
import { useHomeState, FilterMode } from '@/hooks/useHomeState';
import { getEvents } from './api/route';
import { Event } from '@/interfaces/interfaces';
import { parseMSTDate, parseLocalDayjs } from '@/util/dateHelper';

dayjs.extend(isBetween);

type AuthMode = 'login' | 'register';

export default function Home() {
  /* ── sticky calendar/search state ────────────────────────────── */
  const {
    selectedDate,
    setSelectedDate,
    filterMode,
    setFilterMode,
    searchQuery,
    setSearchQuery,
  } = useHomeState();

  /* ── local component state ───────────────────────────────────── */
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  const { user } = useAuth();

  const switchAuthMode = () =>
    setAuthMode((m) => (m === 'login' ? 'register' : 'login'));

  /* ── load events once ────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const data = await getEvents();
        const approved = data
          .filter((e: any) => e.is_approved)
          .sort(
            (a: any, b: any) =>
              parseMSTDate(a.date).getTime() - parseMSTDate(b.date).getTime()
          );
        setEvents(approved);
      } catch (err) {
        console.error('Failed to load events', err);
      }
    })();
  }, []);

  /* ── filter + search whenever deps change ────────────────────── */
  useEffect(() => {
    let filtered: Event[] = [];

    if (filterMode === 'day') {
      filtered = events.filter((e) =>
        parseLocalDayjs(e.date).isSame(selectedDate, 'day')
      );
    } else if (filterMode === 'week') {
      const start = selectedDate.startOf('week');
      const end = selectedDate.endOf('week');
      filtered = events.filter((e) =>
        parseLocalDayjs(e.date).isBetween(start, end, null, '[]')
      );
    } else {
      /* 'all' */
      const today = dayjs().startOf('day');
      filtered = events.filter(
        (e) =>
          parseLocalDayjs(e.date).isSame(today, 'day') ||
          parseLocalDayjs(e.date).isAfter(today)
      );
    }

    if (searchQuery.trim()) {
      const fuse = new Fuse(filtered, {
        keys: ['title', 'genre', 'venue_name', 'description'],
        threshold: 0.3,
      });
      filtered = fuse.search(searchQuery).map((r) => r.item);
    }

    setFilteredEvents(filtered);
  }, [events, selectedDate, filterMode, searchQuery]);

  /* ── handlers ────────────────────────────────────────────────── */
  const handleDateSelect = setSelectedDate;
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFilterMode(e.target.value as FilterMode);

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white font-sans">
      <Header />

      <HeroSection user={user} setAuthMode={switchAuthMode} />

      <div className="text-center py-6 px-4 md:px-0">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gold drop-shadow-md">
          Welcome to Alpine Groove Guide
        </h2>
        <p className="text-gray-300 mt-2 max-w-xl mx-auto text-base md:text-lg">
          Discover the best live music happening across Colorado Springs and
          beyond.
        </p>
      </div>

      <div className="flex flex-1 flex-col md:flex-row gap-4 px-2 sm:px-4 lg:px-8">
        <main className="container mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col gap-6">
            {/* ── calendar ────────────────────────────── */}
            <aside className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-5 rounded-xl shadow-lg border border-gray-700">
              {filterMode === 'all' && (
                <div className="mb-4 text-yellow-300 text-sm border border-yellow-400/50 bg-yellow-100/10 rounded-lg p-3">
                  📌 The calendar is disabled in
                  <strong> All Upcoming Events</strong> mode. <br />
                  To use the calendar, switch to
                  <em> Today’s</em> or <em>This Week’s</em> view.
                </div>
              )}

              <div
                className={
                  filterMode === 'all' ? 'pointer-events-none opacity-40' : ''
                }
              >
                <EventsCalendar
                  currentDate={selectedDate}
                  events={events}
                  onDateSelect={handleDateSelect}
                  filterMode={filterMode}
                />
              </div>
            </aside>

            {/* ── events list + controls ───────────────── */}
            <section id="events" className="flex-grow scroll-mt-20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Events</h1>

                <select
                  id="event-pulldown"
                  value={filterMode}
                  onChange={handleFilterChange}
                  className="p-2 border border-gray-600 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="day">Today&apos;s Events</option>
                  <option value="week">This Week&apos;s Events</option>
                  <option value="all">All Upcoming Events</option>
                </select>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by title, genre, artist, or venue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-md text-black bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              {filteredEvents.length ? (
                <Events events={filteredEvents} />
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
                    Try adjusting your search or filter!
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>

        {/* ── right-hand column (auth + recommendations) ─────────── */}
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
