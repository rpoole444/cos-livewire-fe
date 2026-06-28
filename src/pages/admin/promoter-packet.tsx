import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useAdminRouteGuard } from '@/hooks/useAdminRouteGuard';
import { getRegionLabel } from '@/constants/regions';
import { Event } from '@/interfaces/interfaces';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1350;
const POSTER_CONTENT_TOP = 378;
const POSTER_CONTENT_BOTTOM = 1148;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const wrapText = (value: string, maxChars: number) => {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
};

const groupEventsByDay = (events: Event[]) => events.reduce<Record<string, Event[]>>((acc, event) => {
  const key = dayjs(event.date).isValid() ? dayjs(event.date).format('dddd, MMM D') : 'Date TBA';
  acc[key] = acc[key] || [];
  acc[key].push(event);
  return acc;
}, {});

const formatEventLine = (event: Event) => {
  const date = dayjs(event.date).isValid() ? dayjs(event.date).format('ddd, MMM D') : 'Date TBA';
  const time = event.start_time ? dayjs(`1970-01-01T${event.start_time}`).format('h:mm A') : 'time TBA';
  const region = event.region ? ` (${getRegionLabel(event.region)})` : '';
  const venue = event.venue_name || event.location || 'Venue TBA';
  return `${date} - ${time} - ${event.title} at ${venue}${region}`;
};

type PosterRow =
  | { type: 'day'; label: string; height: number }
  | { type: 'event'; event: Event; dayLabel: string; titleLines: string[]; venueLine: string; height: number };

const buildPosterRows = (events: Event[]): PosterRow[] => {
  const grouped = groupEventsByDay(events);
  const rows: PosterRow[] = [];

  Object.entries(grouped).forEach(([day, dayEvents]) => {
    rows.push({ type: 'day', label: day, height: 60 });
    dayEvents.forEach((event) => {
      const time = event.start_time ? dayjs(`1970-01-01T${event.start_time}`).format('h:mm A') : 'Time TBA';
      const venue = event.venue_name || event.location || 'Venue TBA';
      const titleLines = wrapText(event.title || 'Untitled show', 38).slice(0, 2);
      const venueLine = `${time} - ${venue}`;
      rows.push({
        type: 'event',
        event,
        dayLabel: day,
        titleLines,
        venueLine,
        height: titleLines[1] ? 108 : 80,
      });
    });
    rows.push({ type: 'day', label: '', height: 16 });
  });

  return rows;
};

const paginatePosterRows = (rows: PosterRow[]) => {
  const pages: PosterRow[][] = [];
  let current: PosterRow[] = [];
  let y = POSTER_CONTENT_TOP;

  rows.forEach((row) => {
    if (row.type === 'day' && !row.label) {
      if (current.length) {
        current.push(row);
        y += row.height;
      }
      return;
    }

    const wouldOverflow = y + row.height > POSTER_CONTENT_BOTTOM;
    if (wouldOverflow && current.length) {
      pages.push(current);
      current = [];
      y = POSTER_CONTENT_TOP;

      if (row.type === 'event') {
        const repeatedHeader: PosterRow = { type: 'day', label: row.dayLabel, height: 60 };
        current.push(repeatedHeader);
        y += repeatedHeader.height;
      }
    }

    current.push(row);
    y += row.height;
  });

  if (current.length) pages.push(current);
  return pages.length ? pages : [[]];
};

const renderPosterRows = (rows: PosterRow[]) => {
  let y = POSTER_CONTENT_TOP;
  return rows.map((row) => {
    if (row.type === 'day' && !row.label) {
      y += row.height;
      return '';
    }

    if (row.type === 'day') {
      const markup = `
      <text x="112" y="${y}" font-family="Georgia, serif" font-size="34" font-weight="700" fill="#E0B861" letter-spacing="1">${escapeXml(row.label)}</text>
      <line x1="112" y1="${y + 18}" x2="968" y2="${y + 18}" stroke="#B86432" stroke-width="3" opacity="0.85"/>
      `;
      y += row.height;
      return markup;
    }

    const markup = `
        <circle cx="124" cy="${y - 8}" r="6" fill="#4F7870"/>
        <text x="146" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#F4E7B8">${escapeXml(row.titleLines[0] || '')}</text>
        ${row.titleLines[1] ? `<text x="146" y="${y + 30}" font-family="Helvetica, Arial, sans-serif" font-size="23" font-weight="700" fill="#F4E7B8">${escapeXml(row.titleLines[1])}</text>` : ''}
        <text x="146" y="${y + (row.titleLines[1] ? 62 : 34)}" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#9FC8BF">${escapeXml(row.venueLine)}</text>
      `;
    y += row.height;
    return markup;
  }).join('');
};

const buildPosterSvgPage = (
  rows: PosterRow[],
  weekStart: dayjs.Dayjs,
  weekEnd: dayjs.Dayjs,
  pageNumber: number,
  pageCount: number
) => {
  const pageLabel = pageCount > 1
    ? `<text x="540" y="1178" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="#F4E7B8">Page ${pageNumber} of ${pageCount}</text>`
    : '';

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}">
  <defs>
    <radialGradient id="sun" cx="50%" cy="18%" r="65%">
      <stop offset="0%" stop-color="#263F38"/>
      <stop offset="58%" stop-color="#111610"/>
      <stop offset="100%" stop-color="#0B0C09"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.09"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="1080" height="1350" fill="url(#sun)"/>
  <rect width="1080" height="1350" filter="url(#grain)" opacity="0.55"/>
  <rect x="48" y="48" width="984" height="1254" fill="none" stroke="#C9962E" stroke-width="6"/>
  <rect x="70" y="70" width="940" height="1210" fill="none" stroke="#C9962E" stroke-width="2"/>
  <path d="M70 132 L132 70 M948 70 L1010 132 M70 1218 L132 1280 M948 1280 L1010 1218" stroke="#C9962E" stroke-width="5" fill="none"/>
  <circle cx="540" cy="144" r="54" fill="#B86432" opacity="0.9"/>
  ${Array.from({ length: 33 }).map((_, index) => {
    const angle = Math.PI + (index * Math.PI / 32);
    const x1 = 540 + Math.cos(angle) * 72;
    const y1 = 144 + Math.sin(angle) * 72;
    const x2 = 540 + Math.cos(angle) * 154;
    const y2 = 144 + Math.sin(angle) * 154;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#C9962E" stroke-width="3"/>`;
  }).join('')}
  <text x="540" y="150" text-anchor="middle" font-family="Georgia, serif" font-size="30" font-weight="700" fill="#F4E7B8">AGG</text>
  <text x="540" y="226" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="19" font-weight="800" letter-spacing="8" fill="#9FC8BF">THIS WEEK IN LIVE MUSIC</text>
  <text x="540" y="290" text-anchor="middle" font-family="Georgia, serif" font-size="58" font-weight="700" fill="#E0B861">Front Range Shows</text>
  <text x="540" y="335" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="700" fill="#F4E7B8">${escapeXml(`${weekStart.format('MMM D')} - ${weekEnd.format('MMM D')}`)}</text>
  ${renderPosterRows(rows)}
  ${pageLabel}
  <line x1="190" y1="1220" x2="890" y2="1220" stroke="#C9962E" stroke-width="2"/>
  <text x="540" y="1258" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="700" fill="#E0B861">ALPINEGROOVEGUIDE.COM</text>
  <text x="540" y="1286" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="800" letter-spacing="4" fill="#9FC8BF">LOCAL MUSIC - HUMAN CURATED</text>
</svg>`;
};

const buildPosterSvgPages = (events: Event[], weekStart: dayjs.Dayjs, weekEnd: dayjs.Dayjs) => {
  const pages = paginatePosterRows(buildPosterRows(events));
  return pages.map((rows, index) => buildPosterSvgPage(rows, weekStart, weekEnd, index + 1, pages.length));
};

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
  const weeklyEvents = useMemo(() => (
    events
      .filter((event) => {
        const parsed = dayjs(event.date);
        return parsed.isValid() && parsed.isAfter(weekStart.subtract(1, 'day')) && parsed.isBefore(weekEnd);
      })
      .sort((a, b) => `${a.date} ${a.start_time || ''}`.localeCompare(`${b.date} ${b.start_time || ''}`))
  ), [events, weekEnd, weekStart]);

  const packetText = [
    `This week on Alpine Groove Guide (${weekStart.format('MMM D')} - ${weekEnd.format('MMM D')})`,
    '',
    ...weeklyEvents.map(formatEventLine),
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
            width: 100%;
            height: auto;
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
                    <p className="mt-1 text-slate-400">{formatEventLine(event)}</p>
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
                className="mx-auto flex w-full max-w-[620px] flex-col gap-6"
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
