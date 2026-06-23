import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { ArrowRight, CalendarDays, CalendarSearch, Music2, Search, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import HeroSection from '@/components/HeroSection';
import LoginForm from '@/components/login';
import RegistrationForm from '@/components/registration';
import WelcomeUser from '@/components/WelcomeUser';
import EventsCalendar from '@/components/EventsCalendar';
import { useAuth } from '@/context/AuthContext';
import { useHomeState } from '@/hooks/useHomeState';
import { deleteEvent, getEvents } from './api/route';
import { Event } from '@/interfaces/interfaces';
import { buildEventDateTime, parseLocalDayjs, parseMSTDate } from '@/util/dateHelper';
import { canManageEvent } from '@/util/eventPermissions';
import EventCard from '@/components/EventCard';
import {
  REGION_ALL,
  REGION_FILTER_OPTIONS,
  PREFERRED_REGION_STORAGE_KEY,
  RegionFilterValue,
  getRegionLabel,
  normalizeRegionFilter,
} from '@/constants/regions';

import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type AuthMode = 'login' | 'register';

type HomeProps = {
  initialRegion?: RegionFilterValue;
};

const UPCOMING_PAGE_SIZE = 12;

export default function Home({ initialRegion }: HomeProps = {}) {
  const {
    selectedDate: currentDate,
    setSelectedDate: setCurrentDate,
    searchQuery,
    setSearchQuery,
  } = useHomeState();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<RegionFilterValue>(() => {
    if (initialRegion) return initialRegion;
    if (typeof window === 'undefined') return REGION_ALL;
    return normalizeRegionFilter(localStorage.getItem(PREFERRED_REGION_STORAGE_KEY));
  });
  const [searchAllUpcoming, setSearchAllUpcoming] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('searchAllUpcoming') === 'true';
    }
    return false;
  });
  const [visibleUpcomingCount, setVisibleUpcomingCount] = useState(UPCOMING_PAGE_SIZE);
  const [showHero, setShowHero] = useState(true);
  const router = useRouter();

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

  useEffect(() => {
    if (!router.isReady) return;
    const queryRegion = Array.isArray(router.query.region)
      ? router.query.region[0]
      : router.query.region;
    if (queryRegion) {
      setSelectedRegion(normalizeRegionFilter(queryRegion));
    } else if (initialRegion) {
      setSelectedRegion(initialRegion);
    }
  }, [router.isReady, router.query.region, initialRegion]);

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
    localStorage.setItem(PREFERRED_REGION_STORAGE_KEY, selectedRegion);

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
      if (selectedRegion !== REGION_ALL && event.region !== selectedRegion) return false;
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
  }, [events, currentDate, searchQuery, searchAllUpcoming, selectedRegion]);

  useEffect(() => {
    setVisibleUpcomingCount(UPCOMING_PAGE_SIZE);
  }, [currentDate, searchQuery, searchAllUpcoming, selectedRegion]);

  const regionScopedEvents = selectedRegion === REGION_ALL
    ? events
    : events.filter((event) => event.region === selectedRegion);

  const handleRegionChange = (nextRegion: RegionFilterValue) => {
    setSelectedRegion(nextRegion);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PREFERRED_REGION_STORAGE_KEY, nextRegion);
    }
    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          region: nextRegion === REGION_ALL ? undefined : nextRegion,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleDateSelect = (date: Dayjs) => {
    setCurrentDate(date);
    setSearchQuery('');
    setSearchAllUpcoming(false);
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  const handleViewModeChange = (showAllUpcoming: boolean) => {
    setSearchAllUpcoming(showAllUpcoming);
    if (showAllUpcoming && typeof window !== 'undefined') {
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((event) => event.id !== id));
      setFilteredEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (err) {
      console.error('Failed to delete event', err);
      alert('Unable to delete that event. Please try again.');
    }
  };

  const siteUrl = 'https://app.alpinegrooveguide.com';
  const homeDescription =
    'Community-powered live music calendar for Colorado’s Front Range and beyond.';
  const selectedDateLabel = currentDate.format('MMMM D');
  const selectedDaySummary = searchAllUpcoming
    ? `${filteredEvents.length} upcoming ${filteredEvents.length === 1 ? 'show' : 'shows'}`
    : filteredEvents.length === 1
    ? `1 show on ${selectedDateLabel}`
    : filteredEvents.length > 1
    ? `${filteredEvents.length} shows on ${selectedDateLabel}`
    : `No shows listed for ${selectedDateLabel}`;

  return (
    <>
      <Head>
        <title>Find Live Music in Colorado – Alpine Groove Guide</title>
        <meta name="description" content={homeDescription} />
        <meta property="og:title" content="Find Live Music in Colorado" />
        <meta property="og:description" content={homeDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={`${siteUrl}/alpine_groove_guide_icon.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Find Live Music in Colorado" />
        <meta name="twitter:description" content={homeDescription} />
        <meta name="twitter:image" content={`${siteUrl}/alpine_groove_guide_icon.png`} />
      </Head>
      <div className="flex min-h-screen flex-col bg-black text-ivory font-sans">
      {showHero && (
        <div className="animate-fadeIn transition-opacity duration-700 ease-in-out">
          <HeroSection user={user} setAuthMode={switchAuthMode} />
        </div>
      )}

      <section className="border-b border-gold/30 bg-[#11130e]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:py-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 border border-alpine/60 bg-pine/50 px-3 py-2 text-xs font-black uppercase tracking-wider text-mist">
              <Sparkles className="h-4 w-4" />
              Free community artist pages are open now
            </div>

            <div className="space-y-3">
              <h1 className="agg-display max-w-3xl text-4xl font-semibold leading-[1.08] text-sun-gold md:text-5xl">
                Find Live Music in Colorado
              </h1>
              <p className="max-w-2xl text-base leading-7 text-ivory/70 md:text-lg">
                Community-powered live music calendar for Colorado’s Front Range and beyond.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center justify-center gap-2 border border-gold bg-gold px-5 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-sun-gold focus:outline-none focus:ring-2 focus:ring-sun-gold focus:ring-offset-2 focus:ring-offset-black"
              >
                Browse events
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/artists"
                className="inline-flex items-center justify-center gap-2 border border-alpine px-5 py-3 text-sm font-black uppercase tracking-wider text-ivory transition hover:border-sun-gold hover:text-sun-gold focus:outline-none focus:ring-2 focus:ring-alpine focus:ring-offset-2 focus:ring-offset-black"
              >
                View directory
                <Users className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 text-sm text-ivory/70 sm:grid-cols-3">
              <div className="agg-corner-frame border border-gold/30 bg-black/50 p-4">
                <CalendarDays className="mb-3 h-5 w-5 text-sun-gold" />
                <p className="font-bold text-ivory">Regional calendar</p>
                <p className="mt-1 text-xs leading-5 text-ivory/50">Daily shows, searchable by date, region, genre, venue, and artist.</p>
              </div>
              <div className="agg-corner-frame border border-gold/30 bg-black/50 p-4">
                <Music2 className="mb-3 h-5 w-5 text-alpine" />
                <p className="font-bold text-ivory">Artist pages</p>
                <p className="mt-1 text-xs leading-5 text-ivory/50">Profiles for musicians, venues, promoters, and community builders.</p>
              </div>
              <div className="agg-corner-frame border border-gold/30 bg-black/50 p-4">
                <Users className="mb-3 h-5 w-5 text-copper" />
                <p className="font-bold text-ivory">Scene discovery</p>
                <p className="mt-1 text-xs leading-5 text-ivory/50">A faster way for fans to find what is happening nearby.</p>
              </div>
            </div>
          </div>

          <div className="agg-panel agg-corner-frame p-5">
            <div className="flex items-center gap-4">
              <Image
                src="/icon_mark.svg"
                alt="Alpine Groove Guide"
                width={88}
                height={88}
                className="h-20 w-20 shrink-0 object-contain"
                priority
              />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-alpine">Community Directory</p>
                <h2 className="agg-display mt-1 text-2xl font-semibold text-sun-gold">Artists, venues, promoters.</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-ivory/70">
              Browse community profiles across the Front Range, or create your own page while community access is open.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Link
                href="/artists"
                className="inline-flex items-center justify-center border border-gold bg-gold px-4 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-sun-gold"
              >
                Open directory
              </Link>
              <Link
                href={user ? "/artist-signup" : "/LoginPage?redirect=/artist-signup"}
                className="inline-flex items-center justify-center border border-alpine px-4 py-3 text-sm font-black uppercase tracking-wider text-ivory transition hover:border-sun-gold hover:text-sun-gold"
              >
                Create page
              </Link>
            </div>
          </div>
        </div>
      </section>


      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-14 pt-8">
        {user && <WelcomeUser compact />}

        <div className={classNames("grid gap-6 lg:items-start", user ? "" : "lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]")}>
        <section className="min-w-0">
          <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)] xl:items-start">
            <aside className="agg-panel agg-corner-frame w-full p-5 sm:p-6">
              <EventsCalendar
                currentDate={currentDate}
                events={regionScopedEvents}
                onDateSelect={handleDateSelect}
              />
            </aside>

            <section id="events" className="flex-grow scroll-mt-20" ref={resultsRef}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-alpine">Live Music Calendar</p>
                  <h1 className="agg-display mt-1 text-3xl font-semibold text-sun-gold">Find your next show</h1>
                  <p className="mt-1 text-sm text-ivory/55">
                    {selectedDaySummary}
                    {selectedRegion !== REGION_ALL ? ` · ${getRegionLabel(selectedRegion)}` : ''}
                  </p>
                </div>
                <div className="flex flex-col md:flex-row gap-2 md:items-center w-full md:w-auto">
                  <select
                    aria-label="Filter events by region"
                    value={selectedRegion}
                    onChange={(event) => handleRegionChange(normalizeRegionFilter(event.target.value))}
                    className="w-full border border-gold/40 bg-[#11130e] p-3 text-ivory focus:border-sun-gold focus:outline-none focus:ring-1 focus:ring-sun-gold md:w-56"
                  >
                    {REGION_FILTER_OPTIONS.map((region) => (
                      <option key={region.slug} value={region.slug}>
                        {region.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      placeholder="Search by title, genre, artist, or venue..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border border-gold/40 bg-[#11130e] p-3 pl-10 text-ivory placeholder-ivory/35 focus:border-sun-gold focus:outline-none focus:ring-1 focus:ring-sun-gold"
                    />
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-alpine" />
                  </div>
                </div>
              </div>

              <div className="mb-4 flex w-full flex-col gap-2 rounded-2xl border border-gold/25 bg-black/30 p-2 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  aria-pressed={!searchAllUpcoming}
                  onClick={() => handleViewModeChange(false)}
                  className={classNames(
                    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider transition focus:outline-none focus:ring-2 focus:ring-sun-gold",
                    !searchAllUpcoming
                      ? "bg-gold text-black shadow-lg shadow-gold/15"
                      : "border border-gold/20 text-ivory/70 hover:border-gold/50 hover:text-sun-gold"
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                  Selected Date
                </button>
                <button
                  type="button"
                  aria-pressed={searchAllUpcoming}
                  onClick={() => handleViewModeChange(true)}
                  className={classNames(
                    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider transition focus:outline-none focus:ring-2 focus:ring-sun-gold",
                    searchAllUpcoming
                      ? "bg-gold text-black shadow-lg shadow-gold/15"
                      : "border border-gold/20 text-ivory/70 hover:border-gold/50 hover:text-sun-gold"
                  )}
                >
                  <CalendarSearch className="h-4 w-4" />
                  View All Upcoming Gigs
                </button>
              </div>

              {searchAllUpcoming && searchQuery && (
                <p className="mb-4 text-xs italic text-ivory/45">
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
                        <h2 className="agg-display text-2xl font-semibold text-ivory">
                          {selectedDaySummary}
                        </h2>
                        <p className="text-sm text-ivory/50">
                          {searchAllUpcoming
                            ? 'Upcoming approved shows across the selected region.'
                            : `Events selected for ${currentDate.format('dddd, MMMM D, YYYY')}.`}
                        </p>
                      </div>
                    </header>
                    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                      {(searchAllUpcoming ? filteredEvents.slice(0, visibleUpcomingCount) : filteredEvents).map((event) => {
                        const startTimeISO = buildEventDateTime(event.date, event.start_time);
                        return (
                          <EventCard
                            key={event.id}
                            id={event.id}
                            title={event.title}
                            slug={event.slug}
                            startTime={startTimeISO ?? undefined}
                            city={event.location || undefined}
                            region={event.region}
                            venueName={event.venue_name}
                            imageUrl={event.display_image_url || event.poster || undefined}
                            source={event.source}
                            sourceLabel={event.source_label}
                            isFeatured={(event as any).is_featured}
                            canManage={canManageEvent(user, event)}
                            onDelete={handleDeleteEvent}
                          />
                        );
                      })}
                    </div>
                    {searchAllUpcoming && filteredEvents.length > visibleUpcomingCount && (
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setVisibleUpcomingCount((count) => count + UPCOMING_PAGE_SIZE)}
                          className="inline-flex items-center justify-center border border-gold bg-gold px-5 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-sun-gold focus:outline-none focus:ring-2 focus:ring-sun-gold focus:ring-offset-2 focus:ring-offset-black"
                        >
                          Load More Gigs
                        </button>
                      </div>
                    )}
                  </section>
                ) : (
                  <div className="text-center mt-12 flex flex-col items-center gap-6">
                    <Image
                      src="/icon_mark.svg"
                      alt="Alpine Groove Logo"
                      width={180}
                      height={180}
                      className="animate-pulse object-contain opacity-80"
                    />
                    <p className="text-lg font-medium text-ivory/55">
                      {selectedDaySummary}
                      <br className="hidden sm:inline" />
                      Try another date, region, or search.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>

        {!user && (
        <aside id="auth-section" className="w-full lg:w-[320px] xl:w-[360px] lg:flex-shrink-0">
          <div className="lg:sticky lg:top-24">
            <div className="agg-panel agg-corner-frame space-y-6 p-6 backdrop-blur-md sm:p-8">
              <>
                  <div className="text-center space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-alpine">
                      Alpine Groove Guide
                    </p>
                    <h2 className="agg-display text-xl font-semibold tracking-tight text-sun-gold">
                      {authMode === 'login' ? 'Sign in' : 'Create your account'}
                    </h2>
                    <p className="text-sm text-ivory/50">
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
            </div>
          </div>
        </aside>
        )}
        </div>
      </main>
    </div>
    </>
  );
}
