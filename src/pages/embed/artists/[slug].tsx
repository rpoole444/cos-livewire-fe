import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import { buildEventDateTime, parseLocalDayjs } from '@/util/dateHelper';
import { normalizeExternalUrl } from '@/util/profileValueTools';
import { getEventImageSrc } from '@/util/getEventImageSrc';

interface ScheduleEvent {
  id: number;
  title: string;
  date: string;
  start_time?: string | null;
  venue_name?: string | null;
  venue_profile_id?: number | null;
  location?: string | null;
  poster?: string | null;
  display_image_url?: string | null;
  website_link?: string | null;
  slug: string;
}

interface ArtistSchedule {
  id: number;
  display_name: string;
  slug: string;
  events: ScheduleEvent[];
  profile_type?: 'artist' | 'venue' | 'promoter';
  mode?: 'upcoming' | 'top-picks';
}

interface EmbedScheduleProps {
  schedule: ArtistSchedule;
  theme: 'dark' | 'light';
  layout: 'full' | 'compact';
  showPoster: boolean;
  showTicketButton: boolean;
  embedMode: 'upcoming' | 'top-picks';
  titleOverride: string;
}

const APP_URL = 'https://app.alpinegrooveguide.com';

export default function EmbedArtistSchedule({
  schedule,
  theme,
  layout,
  showPoster,
  showTicketButton,
  embedMode,
  titleOverride,
}: EmbedScheduleProps) {
  const isLight = theme === 'light';
  const isCompact = layout === 'compact';
  const pageClass = isLight
    ? 'min-h-screen bg-stone-50 text-stone-950'
    : 'min-h-screen bg-slate-950 text-slate-50';
  const cardClass = isLight
    ? 'border-stone-200 bg-white hover:border-amber-500'
    : 'border-slate-800 bg-slate-900/80 hover:border-emerald-400/70';
  const secondaryText = isLight ? 'text-stone-600' : 'text-slate-300';
  const mutedText = isLight ? 'text-stone-500' : 'text-slate-400';
  const accentText = isLight ? 'text-amber-700' : 'text-emerald-300';
  const isVenue = schedule.profile_type === 'venue';
  const isTopPicks = embedMode === 'top-picks';
  const eyebrow = isTopPicks
    ? 'Top Picks'
    : isVenue
    ? 'Upcoming at this venue'
    : 'Upcoming shows';
  const displayTitle = titleOverride || schedule.display_name;

  const trackEmbedEvent = async (eventType: string, eventId?: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${schedule.slug}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          event_id: eventId,
          source: 'embed',
        }),
      });
    } catch {}
  };

  useEffect(() => {
    trackEmbedEvent('embed_view');
  }, [schedule.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Head>
        <title>{`${displayTitle} – Alpine Groove Guide`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className={`${pageClass} ${isCompact ? 'p-3' : 'p-4 sm:p-5'}`}>
        <header className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.28em] ${accentText}`}>
              {eyebrow}
            </p>
            <h1 className="mt-1 text-xl font-semibold sm:text-2xl">{displayTitle}</h1>
            {titleOverride && (
              <p className={`mt-0.5 text-xs ${mutedText}`}>{schedule.display_name}</p>
            )}
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
              const eventImage = getEventImageSrc(event);

              return (
                <div
                  key={event.id}
                  className={`grid items-center gap-3 rounded-xl border p-3 transition ${cardClass} ${
                    showPoster && !isCompact ? 'grid-cols-[5rem_1fr_auto]' : 'grid-cols-[4.75rem_1fr_auto]'
                  }`}
                >
                  {showPoster && !isCompact && eventImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={eventImage} alt="" className="h-16 w-20 rounded-lg object-cover" />
                  ) : (
                  <div>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${accentText}`}>
                      {dateLabel}
                    </p>
                    {timeLabel && <p className={`mt-1 text-xs ${mutedText}`}>{timeLabel}</p>}
                  </div>
                  )}
                  <div className="min-w-0">
                    {showPoster && !isCompact && eventImage && (
                      <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${accentText}`}>
                        {dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}
                      </p>
                    )}
                    <h2 className="truncate text-sm font-semibold sm:text-base">{event.title}</h2>
                    {!isCompact && venueLine && <p className={`mt-0.5 truncate text-xs sm:text-sm ${secondaryText}`}>{venueLine}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {showTicketButton && event.website_link ? (
                      <a
                        href={normalizeExternalUrl(event.website_link)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackEmbedEvent('ticket_click', event.id)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
                          isLight ? 'bg-amber-100 text-amber-900' : 'bg-emerald-400 text-slate-950'
                        }`}
                      >
                        Tickets
                      </a>
                    ) : null}
                    <a
                      href={`${APP_URL}/eventRouter/${event.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`text-lg ${mutedText}`}
                      aria-label={`View ${event.title}`}
                    >
                      ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`rounded-xl border p-6 text-center text-sm ${cardClass} ${secondaryText}`}>
            {isTopPicks
              ? 'No Top Picks selected yet.'
              : `No upcoming ${isVenue ? 'events' : 'shows'} are listed yet.`}
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
  const layout = context.query.layout === 'compact' ? 'compact' : 'full';
  const showPoster = context.query.poster !== '0';
  const showTicketButton = context.query.tickets !== '0';
  const embedMode = context.query.mode === 'top-picks' ? 'top-picks' : 'upcoming';
  const titleOverride = String(context.query.title || '').trim().slice(0, 80);
  const requestedLimit = Number.parseInt(String(context.query.limit || ''), 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 12)
    : 5;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/artists/${encodeURIComponent(slug)}/schedule?limit=${limit}&mode=${embedMode}`
    );

    if (!response.ok) {
      return { notFound: true };
    }

    const schedule = await response.json();
    return { props: { schedule, theme, layout, showPoster, showTicketButton, embedMode, titleOverride } };
  } catch (error) {
    console.error('GSSP /embed/artists/[slug] error:', error);
    return { notFound: true };
  }
};
