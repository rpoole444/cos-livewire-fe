import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Event } from '@/interfaces/interfaces';
import { buildPosterSvgPages, formatWeeklyEventLine, getWeeklyEvents } from '@/util/weeklyPoster';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const WeeklyPosterPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const weekStart = dayjs().startOf('day');
  const weekEnd = weekStart.add(7, 'day').endOf('day');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/events`);
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || 'Unable to load events.');
        setEvents(Array.isArray(data) ? data.filter((event) => event.is_approved) : []);
      } catch (error) {
        console.error('Unable to load weekly poster events', error);
        setStatusMessage('Unable to load this week’s events right now.');
      }
    };

    fetchEvents();
  }, []);

  const weeklyEvents = useMemo(() => getWeeklyEvents(events, weekStart, weekEnd), [events, weekEnd, weekStart]);
  const posterSvgs = useMemo(() => buildPosterSvgPages(weeklyEvents, weekStart, weekEnd), [weeklyEvents, weekEnd, weekStart]);

  return (
    <>
      <Head>
        <title>This Week in Live Music - Alpine Groove Guide</title>
        <meta
          name="description"
          content="A shareable weekly live music poster from Alpine Groove Guide."
        />
        <meta property="og:title" content="This Week in Live Music - Alpine Groove Guide" />
        <meta property="og:description" content="Front Range shows for the next seven days." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://app.alpinegrooveguide.com/weekly-poster" />
        <meta property="og:image" content="https://app.alpinegrooveguide.com/alpine_groove_guide_favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <style>{`
          .weekly-poster-public svg {
            display: block;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
          }
        `}</style>
      </Head>
      <div className="min-h-screen bg-gray-950 px-4 py-8 text-slate-100 sm:px-6 sm:py-12">
        <main className="mx-auto max-w-5xl space-y-8">
          <header className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#111610] via-slate-950 to-black p-6 shadow-2xl shadow-black/40 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Shareable poster</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">This Week in Live Music</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Community-powered Front Range shows for {weekStart.format('MMM D')} - {weekEnd.format('MMM D')}.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/" className="rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300">
                Open calendar
              </Link>
              <Link href="/eventSubmission" className="rounded-full border border-emerald-300/60 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20">
                Submit a show
              </Link>
            </div>
          </header>

          {statusMessage && (
            <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {statusMessage}
            </p>
          )}

          <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-white">{weeklyEvents.length} shows this week</h2>
              <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {weeklyEvents.length ? weeklyEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/eventRouter/${event.slug}`}
                    className="block rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm transition hover:border-emerald-400/60"
                  >
                    <p className="font-semibold text-white">{event.title}</p>
                    <p className="mt-1 text-slate-400">{formatWeeklyEventLine(event)}</p>
                  </Link>
                )) : (
                  <p className="text-sm text-slate-400">No approved events found for the next seven days.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-500/30 bg-black/50 p-3 sm:p-5">
              <div className="mx-auto flex w-full max-w-full flex-col gap-6 sm:max-w-[620px]">
                {posterSvgs.map((posterSvg, index) => (
                  <div
                    key={index}
                    className="weekly-poster-public overflow-hidden rounded-xl shadow-2xl shadow-black/60"
                    dangerouslySetInnerHTML={{ __html: posterSvg }}
                  />
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default WeeklyPosterPage;
