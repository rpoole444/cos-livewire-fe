import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useAdminRouteGuard } from '@/hooks/useAdminRouteGuard';
import { Event } from '@/interfaces/interfaces';
import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  buildPosterSvgPages,
  formatWeeklyEventLine,
  getWeeklyEvents,
} from '@/util/weeklyPoster';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const AdminPromoterPacketPage = () => {
  const { isAuthorized, loading } = useAdminRouteGuard();
  const [events, setEvents] = useState<Event[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/events`, { credentials: 'include' });
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || 'Unable to load events.');
        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Unable to load weekly packet events', error);
        setStatusMessage('Unable to load approved events right now.');
      }
    };

    fetchEvents();
  }, [isAuthorized]);

  const weekStart = dayjs().startOf('day');
  const weekEnd = weekStart.add(7, 'day').endOf('day');
  const weeklyEvents = useMemo(() => getWeeklyEvents(events, weekStart, weekEnd), [events, weekEnd, weekStart]);

  const packetText = [
    `This week on Alpine Groove Guide (${weekStart.format('MMM D')} - ${weekEnd.format('MMM D')})`,
    '',
    ...weeklyEvents.map(formatWeeklyEventLine),
    '',
    'Full calendar: https://app.alpinegrooveguide.com',
  ].join('\n');
  const posterSvgs = useMemo(() => buildPosterSvgPages(weeklyEvents, weekStart, weekEnd), [weeklyEvents, weekEnd, weekStart]);

  const downloadPosterPng = async () => {
    try {
      for (let index = 0; index < posterSvgs.length; index += 1) {
        const svgBlob = new Blob([posterSvgs[index]], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const image = new Image();
        image.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = POSTER_WIDTH;
        canvas.height = POSTER_HEIGHT;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Unable to create poster canvas.');
        context.drawImage(image, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);
        URL.revokeObjectURL(url);

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `alpine-groove-weekly-poster-${weekStart.format('YYYY-MM-DD')}${posterSvgs.length > 1 ? `-page-${index + 1}` : ''}.png`;
        link.click();
        await new Promise((resolve) => window.setTimeout(resolve, 150));
      }

      setStatusMessage(`${posterSvgs.length} poster page${posterSvgs.length === 1 ? '' : 's'} downloaded.`);
    } catch (error) {
      console.error('Unable to download poster', error);
      setStatusMessage('Unable to download poster image.');
    }
  };

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-950 px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-950/70 p-8">
          <p className="text-sm text-slate-400">Checking admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Weekly Promoter Packet - Alpine Groove Guide</title>
        <style>{`
          .weekly-poster-print-page svg {
            display: block;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
          }
          @media print {
            body * { visibility: hidden !important; }
            #weekly-poster-print, #weekly-poster-print *, .weekly-poster-print-page, .weekly-poster-print-page * {
              visibility: visible !important;
            }
            #weekly-poster-print {
              position: absolute !important;
              inset: 0 !important;
              width: 100vw !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            .weekly-poster-print-page {
              page-break-after: always;
              break-after: page;
              box-shadow: none !important;
              border-radius: 0 !important;
              overflow: visible !important;
            }
            .weekly-poster-print-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .weekly-poster-print-page svg {
              width: 100% !important;
              height: auto !important;
              max-height: 100vh !important;
            }
          }
        `}</style>
      </Head>
      <div className="min-h-screen bg-gray-950 px-6 py-12 text-slate-100">
        <main className="mx-auto max-w-5xl space-y-8">
          <header className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Admin Tools</p>
            <h1 className="mt-3 text-3xl font-semibold">Weekly promoter packet</h1>
            <p className="mt-2 text-sm text-slate-400">
              Generate quick copy from approved events for newsletters, posts, and partner calendars.
            </p>
          </header>

          {statusMessage && (
            <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {statusMessage}
            </p>
          )}

          <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
              <h2 className="text-lg font-semibold">{weeklyEvents.length} events this week</h2>
              <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
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

            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold">Copy-ready packet</h2>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(packetText);
                    setStatusMessage('Weekly packet copied.');
                  }}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Copy packet
                </button>
              </div>
              <textarea
                value={packetText}
                readOnly
                rows={20}
                className="mt-4 w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-200"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-[#111610] via-slate-950 to-black p-6 shadow-2xl shadow-black/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Shareable poster</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">This week&apos;s gigs, poster style</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Save this as PNG pages for social posts, or print the full set to PDF. Long weeks automatically split across pages.
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                  {posterSvgs.length} poster page{posterSvgs.length === 1 ? '' : 's'} generated
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={downloadPosterPng}
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300"
                >
                  Download PNG pages
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full border border-amber-300/60 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20"
                >
                  Print / Save PDF
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-auto rounded-2xl border border-amber-500/30 bg-black/50 p-4">
              <div
                id="weekly-poster-print"
                className="mx-auto flex w-full max-w-full flex-col gap-6 sm:max-w-[620px]"
              >
                {posterSvgs.map((posterSvg, index) => (
                  <div
                    key={index}
                    className="weekly-poster-print-page overflow-hidden rounded-xl shadow-2xl shadow-black/60"
                    dangerouslySetInnerHTML={{ __html: posterSvg }}
                  />
                ))}
              </div>
            </div>
          </section>

          <Link href="/AdminService" className="inline-flex rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500">
            Back to admin
          </Link>
        </main>
      </div>
    </>
  );
};

export default AdminPromoterPacketPage;
