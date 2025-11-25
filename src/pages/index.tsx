import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
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
import { buildEventDateTime, parseLocalDayjs, parseMSTDate } from '@/util/dateHelper';
import EventCard from '@/components/EventCard';

import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type AuthMode = 'login' | 'register';

export default function Home() {
  const {
    selectedDate: currentDate,
    setSelectedDate: setCurrentDate,
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
        console.log("[Home] fetched events from API:", data.length);
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

    const matchesSearch = (event: Event) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(q) ||
        (event.genre && event.genre.toLowerCase().includes(q)) ||
        (event.venue_name && event.venue_name.toLowerCase().includes(q)) ||
        (event.location && event.location.toLowerCase().includes(q))
      );
    };

    const filtered = events.filter((event) => {
      if (!matchesSearch(event)) return false;

      const eventDate = parseLocalDayjs(event.date);
      if (!eventDate.isValid()) {
        console.warn("[Home] filteredEvents: invalid event.date", {
          id: event.id,
          title: event.title,
          date: event.date,
        });
        return false;
      }

      if (searchAllUpcoming) {
        return eventDate.isSame(today, "day") || eventDate.isAfter(today, "day");
      }

      return eventDate.isSame(currentDate, "day");
    });

    setFilteredEvents(filtered);

    if (searchAllUpcoming && searchQuery && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, currentDate, searchQuery, searchAllUpcoming]);

  console.log(
    "[Home] events from props:",
    events.length,
    "first3=",
    events.slice(0, 3).map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      start_time: e.start_time,
    }))
  );

  console.log(
    "[Home] filteredEvents:",
    filteredEvents.length,
    "currentDate=",
    currentDate.format("YYYY-MM-DD"),
    "searchAllUpcoming=",
    searchAllUpcoming,
    "searchQuery=",
    searchQuery
  );


  const handleDateSelect = (date: Dayjs) => {
    console.log("[Home] handleDateSelect", date.format("YYYY-MM-DD"));
    setCurrentDate(date);
    setSearchQuery('');
    setSearchAllUpcoming(false);
  };

  const siteUrl = 'https://app.alpinegrooveguide.com';
  const homeDescription =
    'Alpine Groove Guide is the Colorado Front Range live music calendar—discover concerts, browse Pro pages for artists, venues, and promoters, and share your own events in one premium feed.';

  return (
    <>
      <Head>
        <title>Alpine Groove Guide – Live Music on the Colorado Front Range</title>
        <meta name="description" content={homeDescription} />
        <meta property="og:title" content="Alpine Groove Guide – Live Music on the Colorado Front Range" />
        <meta property="og:description" content={homeDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={`${siteUrl}/alpine_groove_guide_icon.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Alpine Groove Guide – Live Music on the Colorado Front Range" />
        <meta name="twitter:description" content={homeDescription} />
        <meta name="twitter:image" content={`${siteUrl}/alpine_groove_guide_icon.png`} />
      </Head>
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
            <h3 className="text-lg font-bold mb-2 text-yellow-300">🧑‍🎤 Pro Directory (Admin Preview)</h3>
            <p className="text-sm text-gray-300 mb-4">
              Preview and test Alpine Pro pages for artists, venues, and promoters before they go live to the public.
            </p>
            <Link href="/artists">
              <a className="inline-block px-4 py-2 bg-yellow-500 text-black rounded font-semibold hover:bg-yellow-400">
                View Directory
              </a>
            </Link>
          </div>
        </div>
      )}


      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 lg:flex-row lg:items-start lg:gap-8">
        <section className="flex-1 min-w-0">
          <div className="flex flex-col gap-6">
            <aside className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-5 rounded-xl shadow-lg border border-gray-700">
              <EventsCalendar
                currentDate={currentDate}
                events={events}
                onDateSelect={handleDateSelect}
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
                        const startTimeISO = buildEventDateTime(event.date, event.start_time);
                        console.log("[Home] rendering EventCard", {
                          id: event.id,
                          title: event.title,
                          date: event.date,
                          start_time: event.start_time,
                          startTimeISO,
                        });
                        return (
                          <EventCard
                            key={event.id}
                            title={event.title}
                            slug={event.slug}
                            startTime={startTimeISO ?? undefined}
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
        </section>

        <aside id="auth-section" className="w-full lg:w-[320px] xl:w-[360px] lg:flex-shrink-0">
          <div className="lg:sticky lg:top-24">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-2xl shadow-black/50 backdrop-blur-md sm:p-8 space-y-6">
              {user ? (
                <div className="space-y-6">
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
                </div>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
                      Alpine Groove Guide
                    </p>
                    <h2 className="text-xl font-semibold tracking-tight text-slate-50">
                      {authMode === 'login' ? 'Sign in' : 'Create your account'}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {authMode === 'login'
                        ? 'Log in to manage your shows and stay in sync with the calendar.'
                        : 'Sign up to start showcasing your events and artist presence.'}
                    </p>
                  </div>
                  {authMode === 'login' ? (
                    <LoginForm setAuthMode={switchAuthMode} />
                  ) : (
                    <RegistrationForm setAuthMode={switchAuthMode} />
                  )}
                </>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
    </>
  );
}
