import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import dayjs from 'dayjs';
import { buildEventDateTime, parseLocalDayjs } from '@/util/dateHelper';

interface ScheduleEvent {
  id: number;
  title: string;
  date: string;
  start_time?: string | null;
  venue_name?: string | null;
  location?: string | null;
  slug: string;
}

interface ArtistSchedule {
  id: number;
  display_name: string;
  slug: string;
  events: ScheduleEvent[];
}

interface EmbedScheduleProps {
  schedule: ArtistSchedule;
  theme: 'dark' | 'light';
}

const APP_URL = 'https://app.alpinegrooveguide.com';

export default function EmbedArtistSchedule({ schedule, theme }: EmbedScheduleProps) {
  const isLight = theme === 'light';
  const pageClass = isLight
    ? 'min-h-screen bg-stone-50 text-stone-950'
    : 'min-h-screen bg-slate-950 text-slate-50';
  const cardClass = isLight
    ? 'border-stone-200 bg-white hover:border-amber-500'
    : 'border-slate-800 bg-slate-900/80 hover:border-emerald-400/70';
  const secondaryText = isLight ? 'text-stone-600' : 'text-slate-300';
  const mutedText = isLight ? 'text-stone-500' : 'text-slate-400';
  const accentText = isLight ? 'text-amber-700' : 'text-emerald-300';

  return (
    <>
      <Head>
        <title>{`${schedule.display_name} upcoming shows`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className={`${pageClass} p-4 sm:p-5`}>
        <header className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.28em] ${accentText}`}>
              Upcoming shows
            </p>
            <h1 className="mt-1 text-xl font-semibold sm:text-2xl">{schedule.display_name}</h1>
          </div>
          <a
            href={`${APP_URL}/artists/${schedule.slug}`}
            target="_blank"
            rel="noreferrer"
            className={`shrink-0 text-xs font-semibold underline-offset-4 hover:underline ${mutedText}`}
          >
            Full profile
          </a>
        </header>

        {schedule.events.length > 0 ? (
          <div className="space-y-2.5">
            {schedule.events.map((event) => {
              const date = event.date ? parseLocalDayjs(event.date) : null;
              const startDateTime = buildEventDateTime(event.date, event.start_time || undefined);
              const time = startDateTime ? dayjs(startDateTime) : null;
              const dateLabel = date?.isValid() ? date.format('ddd, MMM D') : 'Date TBA';
              const timeLabel = time?.isValid() ? time.format('h:mm A') : null;
              const venueLine = [event.venue_name, event.location].filter(Boolean).join(' · ');

              return (
                <a
                  key={event.id}
                  href={`${APP_URL}/eventRouter/${event.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`grid grid-cols-[4.75rem_1fr_auto] items-center gap-3 rounded-xl border p-3 transition ${cardClass}`}
                >
                  <div>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${accentText}`}>
                      {dateLabel}
                    </p>
                    {timeLabel && <p className={`mt-1 text-xs ${mutedText}`}>{timeLabel}</p>}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold sm:text-base">{event.title}</h2>
                    {venueLine && <p className={`mt-0.5 truncate text-xs sm:text-sm ${secondaryText}`}>{venueLine}</p>}
                  </div>
                  <span className={`text-lg ${mutedText}`} aria-hidden="true">↗</span>
                </a>
              );
            })}
          </div>
        ) : (
          <div className={`rounded-xl border p-6 text-center text-sm ${cardClass} ${secondaryText}`}>
            No upcoming shows are listed yet.
          </div>
        )}

        <footer className={`mt-4 text-right text-[10px] uppercase tracking-[0.18em] ${mutedText}`}>
          Powered by{' '}
          <a href={APP_URL} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
            Alpine Groove Guide
          </a>
        </footer>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<EmbedScheduleProps> = async (context) => {
  const slug = String(context.params?.slug || '');
  const theme = context.query.theme === 'light' ? 'light' : 'dark';
  const requestedLimit = Number.parseInt(String(context.query.limit || ''), 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 12)
    : 5;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/artists/${encodeURIComponent(slug)}/schedule?limit=${limit}`
    );

    if (!response.ok) {
      return { notFound: true };
    }

    const schedule = await response.json();
    return { props: { schedule, theme } };
  } catch (error) {
    console.error('GSSP /embed/artists/[slug] error:', error);
    return { notFound: true };
  }
};
