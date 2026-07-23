import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Event } from '@/interfaces/interfaces';
import { REGION_ALL, REGION_FILTER_OPTIONS, RegionFilterValue, getRegionLabel, normalizeRegionFilter } from '@/constants/regions';
import { buildPosterSvgPages, formatWeeklyEventLine, getWeeklyEvents } from '@/util/weeklyPoster';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

type ThisWeekGuideProps = {
  initialRegion?: RegionFilterValue;
};

const selectedRegionHref = (region: RegionFilterValue) => (
  region === REGION_ALL ? '/this-week' : `/this-week/${region}`
);

const ThisWeekGuide = ({ initialRegion = REGION_ALL }: ThisWeekGuideProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [region, setRegion] = useState<RegionFilterValue>(normalizeRegionFilter(initialRegion));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const weekStart = useMemo(() => dayjs().startOf('day'), []);
  const weekEnd = useMemo(() => weekStart.add(7, 'day').endOf('day'), [weekStart]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const params = new URLSearchParams({
          from: weekStart.format('YYYY-MM-DD'),
          to: weekEnd.format('YYYY-MM-DD'),
          limit: '500',
        });
        const res = await fetch(`${API_BASE_URL}/api/events?${params.toString()}`);
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || 'Unable to load events.');
        setEvents(Array.isArray(data) ? data.filter((event) => event.is_approved) : []);
      } catch (error) {
        console.error('Unable to load this week guide events', error);
        setStatusMessage('Unable to load this week’s events right now.');
      }
    };

    fetchEvents();
  }, [weekEnd, weekStart]);

  const weeklyEvents = useMemo(() => {
    const filtered = region === REGION_ALL
      ? events
      : events.filter((event) => event.region === region);
    return getWeeklyEvents(filtered, weekStart, weekEnd);
  }, [events, region, weekEnd, weekStart]);

  const topPicks = useMemo(
    () => weeklyEvents.filter((event) => Boolean((event as any).is_featured)).slice(0, 6),
    [weeklyEvents],
  );
  const posterSvgs = useMemo(
    () => buildPosterSvgPages(weeklyEvents, weekStart, weekEnd).slice(0, 1),
    [weeklyEvents, weekEnd, weekStart],
  );
  const titleRegion = region === REGION_ALL ? 'Colorado' : getRegionLabel(region);
  const pageTitle = `This Week in Live Music - ${titleRegion} - Alpine Groove Guide`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={`Find live music happening this week in ${titleRegion}. Community-powered shows, venues, artists, and claimable listings.`}
        />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={`This week’s live music guide for ${titleRegion}.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://app.alpinegrooveguide.com${selectedRegionHref(region)}`} />
        <meta property="og:image" content="https://app.alpinegrooveguide.com/alpine_groove_guide_favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://app.alpinegrooveguide.com${selectedRegionHref(region)}`} />
        <style>{`
          .this-week-poster svg {
            display: block;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-[#050806] px-4 py-8 text-ivory sm:px-6 sm:py-12">
        <main className="mx-auto max-w-6xl space-y-8">
          <header className="overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-pine via-slate-950 to-black p-6 shadow-2xl shadow-black/40 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-alpine">This week</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <h1 className="agg-display text-4xl font-semibold leading-tight text-sun-gold sm:text-6xl">
                  This Week in Live Music
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-mist">
                  {weekStart.format('MMM D')} - {weekEnd.format('MMM D')} • {titleRegion}. Find shows, share the weekly guide, and claim listings that need better details.
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-black/35 p-4">
                <Link href="/" className="rounded-xl bg-gold px-4 py-3 text-center text-sm font-black uppercase tracking-wider text-night transition hover:bg-sun-gold">
                  Open full calendar
                </Link>
                <Link href="/eventSubmission" className="rounded-xl border border-emerald-300/60 px-4 py-3 text-center text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/15">
                  Submit a show
                </Link>
                <Link href="/weekly-poster" className="rounded-xl border border-copper/70 px-4 py-3 text-center text-sm font-bold text-mist transition hover:bg-copper/15">
                  View poster pages
                </Link>
              </div>
            </div>
          </header>

          <section className="rounded-3xl border border-slate-800 bg-slate-950/75 p-4 sm:p-5">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-slate-400">Filter by region</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {REGION_FILTER_OPTIONS.map((option) => {
                const active = option.slug === region;
                return (
                  <Link
                    key={option.slug}
                    href={selectedRegionHref(option.slug)}
                    onClick={() => setRegion(option.slug)}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition ${
                      active
                        ? 'border-gold bg-gold text-night'
                        : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
          </section>

          {statusMessage && (
            <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {statusMessage}
            </p>
          )}

          <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {topPicks.length > 0 && (
                <section className="rounded-3xl border border-gold/30 bg-gold/10 p-5 sm:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-sun-gold">Top picks</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {topPicks.map((event) => (
                      <Link key={event.id} href={`/eventRouter/${event.slug}`} className="rounded-2xl border border-gold/20 bg-black/30 p-4 transition hover:border-gold">
                        <p className="font-bold text-ivory">{event.title}</p>
                        <p className="mt-1 text-sm text-mist">{formatWeeklyEventLine(event)}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-3xl border border-slate-800 bg-slate-950/75 p-5 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-alpine">Full weekly guide</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">{weeklyEvents.length} shows this week</h2>
                  </div>
                  <Link href="/for-artists" className="text-sm font-bold text-emerald-300 hover:text-emerald-200">
                    Artists: claim and improve listings →
                  </Link>
                </div>
                <div className="mt-5 divide-y divide-slate-800">
                  {weeklyEvents.length ? weeklyEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/eventRouter/${event.slug}`}
                      className="block py-4 transition hover:bg-slate-900/40 sm:px-3"
                    >
                      <p className="font-semibold text-white">{event.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{formatWeeklyEventLine(event)}</p>
                    </Link>
                  )) : (
                    <p className="py-8 text-sm text-slate-400">
                      No approved events found for this week in {titleRegion}. Try All Front Range or submit a show.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-amber-500/30 bg-black/50 p-3 sm:p-4">
                <p className="mb-3 px-1 text-xs font-black uppercase tracking-[0.25em] text-amber-300">Share poster</p>
                <div className="this-week-poster overflow-hidden rounded-2xl">
                  {posterSvgs.map((posterSvg, index) => (
                    <div key={index} dangerouslySetInnerHTML={{ __html: posterSvg }} />
                  ))}
                </div>
                <Link href="/weekly-poster" className="mt-4 block rounded-xl border border-amber-300/60 px-4 py-3 text-center text-sm font-bold text-amber-100 transition hover:bg-amber-500/15">
                  Open printable poster pages
                </Link>
              </section>

              <section className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Make it better</p>
                <h2 className="mt-2 text-xl font-bold text-white">See a listing you own?</h2>
                <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                  Claim it to add the right poster, links, lineup, and details so fans get the best version of the show.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Link href="/for-artists" className="rounded-xl bg-emerald-400 px-4 py-3 text-center text-sm font-black text-night transition hover:bg-emerald-300">
                    For artists
                  </Link>
                  <Link href="/for-venues" className="rounded-xl border border-emerald-300/60 px-4 py-3 text-center text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/15">
                    For venues
                  </Link>
                </div>
              </section>
            </aside>
          </section>
        </main>
      </div>
    </>
  );
};

export default ThisWeekGuide;
