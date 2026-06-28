import dayjs from 'dayjs';
import { getRegionLabel } from '@/constants/regions';
import { Event } from '@/interfaces/interfaces';

export const POSTER_WIDTH = 1080;
export const POSTER_HEIGHT = 1350;

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

export const formatWeeklyEventLine = (event: Event) => {
  const date = dayjs(event.date).isValid() ? dayjs(event.date).format('ddd, MMM D') : 'Date TBA';
  const time = event.start_time ? dayjs(`1970-01-01T${event.start_time}`).format('h:mm A') : 'time TBA';
  const region = event.region ? ` (${getRegionLabel(event.region)})` : '';
  const venue = event.venue_name || event.location || 'Venue TBA';
  return `${date} - ${time} - ${event.title} at ${venue}${region}`;
};

export const getWeeklyEvents = (events: Event[], weekStart: dayjs.Dayjs, weekEnd: dayjs.Dayjs) => (
  events
    .filter((event) => {
      const parsed = dayjs(event.date);
      return parsed.isValid() && parsed.isAfter(weekStart.subtract(1, 'day')) && parsed.isBefore(weekEnd);
    })
    .sort((a, b) => `${a.date} ${a.start_time || ''}`.localeCompare(`${b.date} ${b.start_time || ''}`))
);

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
      rows.push({
        type: 'event',
        event,
        dayLabel: day,
        titleLines,
        venueLine: `${time} - ${venue}`,
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
        <circle cx="124" cy="${y - 8}" r="6" fill="#9FC8BF"/>
        <text x="146" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="800" fill="#F4E7B8" stroke="#0B0C09" stroke-width="2" paint-order="stroke">${escapeXml(row.titleLines[0] || '')}</text>
        ${row.titleLines[1] ? `<text x="146" y="${y + 30}" font-family="Helvetica, Arial, sans-serif" font-size="23" font-weight="800" fill="#F4E7B8" stroke="#0B0C09" stroke-width="2" paint-order="stroke">${escapeXml(row.titleLines[1])}</text>` : ''}
        <text x="146" y="${y + (row.titleLines[1] ? 62 : 34)}" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#B8DDD6" stroke="#0B0C09" stroke-width="1.5" paint-order="stroke">${escapeXml(row.venueLine)}</text>
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
  pageCount: number,
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
  <text x="540" y="226" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="19" font-weight="800" letter-spacing="8" fill="#9FC8BF" stroke="#0B0C09" stroke-width="1.5" paint-order="stroke">THIS WEEK IN LIVE MUSIC</text>
  <text x="540" y="290" text-anchor="middle" font-family="Georgia, serif" font-size="58" font-weight="700" fill="#E0B861" stroke="#0B0C09" stroke-width="2" paint-order="stroke">Front Range Shows</text>
  <text x="540" y="335" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="700" fill="#F4E7B8" stroke="#0B0C09" stroke-width="1.5" paint-order="stroke">${escapeXml(`${weekStart.format('MMM D')} - ${weekEnd.format('MMM D')}`)}</text>
  ${renderPosterRows(rows)}
  ${pageLabel}
  <line x1="190" y1="1220" x2="890" y2="1220" stroke="#C9962E" stroke-width="2"/>
  <text x="540" y="1258" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="700" fill="#E0B861">ALPINEGROOVEGUIDE.COM</text>
  <text x="540" y="1286" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="800" letter-spacing="4" fill="#9FC8BF" stroke="#0B0C09" stroke-width="1.5" paint-order="stroke">LOCAL MUSIC - HUMAN CURATED</text>
</svg>`;
};

export const buildPosterSvgPages = (events: Event[], weekStart: dayjs.Dayjs, weekEnd: dayjs.Dayjs) => {
  const pages = paginatePosterRows(buildPosterRows(events));
  return pages.map((rows, index) => buildPosterSvgPage(rows, weekStart, weekEnd, index + 1, pages.length));
};
