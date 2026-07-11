import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { CalendarDays, MapPin, Music2 } from 'lucide-react';
import EventCard from '@/components/EventCard';
import {
  MUSIC_REGIONS,
  getRegionLabel,
  isMusicRegionSlug,
  type MusicRegionSlug,
} from '@/constants/regions';
import { Event } from '@/interfaces/interfaces';
import { buildEventDateTime, parseLocalDayjs } from '@/util/dateHelper';
import {
  API_BASE_URL,
  SITE_URL,
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  getSeoIndexabilityStatus,
} from '@/lib/seo';

type EventsRegionPageProps = {
  region: MusicRegionSlug;
  events: Event[];
  upcomingEventCount: number;
};

const REGION_COPY: Partial<Record<MusicRegionSlug, string>> = {
  'colorado-springs': 'Find concerts, jazz nights, open mics, patio shows, and community live music around Colorado Springs.',
  denver: 'Explore live music across Denver, from listening rooms and jazz clubs to theaters, bars, and major stages.',
  boulder: 'Find Boulder live music, venue calendars, touring shows, and local artist events.',
  'pueblo-area': 'Discover live music around Pueblo and nearby southern Colorado communities.',
};

const eventCity = (event: Event) =>
  event.venue_profile_city ||
  (event.location || event.address || '').split(',').map((part) => part.trim()).find(Boolean) ||
  null;

export default function EventsRegionPage({
  region,
  events,
  upcomingEventCount,
}: EventsRegionPageProps) {
  const regionLabel = getRegionLabel(region);
  const canonicalUrl = `${SITE_URL}/events/${region}`;
  const pageTitle = `Live Music in ${regionLabel} | Concerts & Events | Alpine Groove Guide`;
  const description =
    REGION_COPY[region] ||
    `Find live music in ${regionLabel}. Browse community-powered concerts, venue shows, artist events, and regional listings on Alpine Groove Guide.`;
  const indexability = getSeoIndexabilityStatus({
    kind: 'region-events',
    upcomingEventCount,
    hasCanonical: true,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Alpine Groove Guide', url: SITE_URL },
    { name: 'Events', url: `${SITE_URL}/events/${region}` },
    { name: regionLabel, url: canonicalUrl },
  ]);
  const itemListJsonLd = buildItemListJsonLd(
    `Upcoming live music in ${regionLabel}`,
    events.slice(0, 20).map((event) => ({
      name: event.title,
      url: `${SITE_URL}/eventRouter/${event.slug}`,
    }))
  );

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta name="robots" content={indexability.robots} />
        <meta property="og:site_name" content="Alpine Groove Guide" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={`${SITE_URL}/alpine-groove-social-cover.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${SITE_URL}/alpine-groove-social-cover.png`} />
        <link rel="canonical" href={canonicalUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      </Head>

      <main className="min-h-screen bg-[#050806] px-4 py-10 text-ivory sm:px-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="agg-corner-frame border border-gold/40 bg-gradient-to-br from-[#192018] via-black to-[#0b0c09] p-6 shadow-2xl shadow-black/40 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-alpine">Regional Calendar</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
              <div>
                <h1 className="agg-display max-w-4xl text-4xl font-semibold leading-tight text-sun-gold sm:text-6xl">
                  Live Music in {regionLabel}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-mist sm:text-lg">{description}</p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm text-ivory/70">
                  <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-black/35 px-4 py-2">
                    <CalendarDays className="h-4 w-4 text-sun-gold" />
                    {upcomingEventCount} upcoming {upcomingEventCount === 1 ? 'show' : 'shows'}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-alpine/40 bg-black/35 px-4 py-2">
                    <MapPin className="h-4 w-4 text-alpine" />
                    {regionLabel}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-black/45 p-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Explore nearby</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {MUSIC_REGIONS.map((option) => (
                    <Link
                      key={option.slug}
                      href={`/events/${option.slug}`}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        option.slug === region
                          ? 'border-gold bg-gold text-night'
                          : 'border-slate-700 text-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {option.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {!indexability.shouldIndex && (
            <section className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-50">
              This regional page is available for visitors, but it is currently marked noindex until it has at least 3 upcoming shows.
            </section>
          )}

          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-alpine">Upcoming Shows</p>
                  <h2 className="agg-display mt-1 text-3xl font-semibold text-sun-gold">
                    {events.length ? `${events.length} shows listed` : 'No shows listed yet'}
                  </h2>
                </div>
                <Link href="/eventSubmission" className="text-sm font-bold text-emerald-300 hover:text-emerald-200">
                  Submit a show →
                </Link>
              </div>

              {events.length ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      id={event.id}
                      title={event.title}
                      slug={event.slug}
                      startTime={buildEventDateTime(event.date, event.start_time) || event.date}
                      city={eventCity(event)}
                      region={event.region}
                      venueName={event.venue_profile_display_name || event.venue_name}
                      imageUrl={event.display_image_url || event.poster}
                      source={event.source}
                      sourceLabel={event.source_label}
                      claimedArtist={event.claimed_artist}
                      artistProfileId={event.artist_profile_id}
                      venueProfileId={event.venue_profile_id}
                      venueProfileUserId={event.venue_profile_user_id}
                      submitterUserId={event.user_id}
                      claimedByUserId={event.claimed_by_user_id}
                      lastEditedByUserId={event.last_edited_by_user_id}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/75 p-8 text-slate-300">
                  No approved upcoming events are listed for {regionLabel} yet. Add a show or check All Front Range.
                </div>
              )}
            </div>

            <aside className="space-y-5">
              <section className="rounded-3xl border border-slate-800 bg-slate-950/75 p-5">
                <Music2 className="h-6 w-6 text-sun-gold" />
                <h2 className="mt-3 text-xl font-bold text-white">Make this page stronger</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Artists, venues, and promoters can submit shows, claim imported listings, and help keep this regional calendar accurate.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Link href="/eventSubmission" className="rounded-xl bg-gold px-4 py-3 text-center text-sm font-black text-night transition hover:bg-sun-gold">
                    Submit events
                  </Link>
                  <Link href="/for-venues" className="rounded-xl border border-emerald-300/60 px-4 py-3 text-center text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/15">
                    Claim a venue
                  </Link>
                </div>
              </section>
            </aside>
          </section>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<EventsRegionPageProps> = async (context) => {
  const regionParam = context.params?.region;
  const region = Array.isArray(regionParam) ? regionParam[0] : regionParam;

  if (!isMusicRegionSlug(region)) {
    return { notFound: true };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/events?region=${region}`);
    const data = await response.json().catch(() => []);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events = Array.isArray(data)
      ? data
          .filter((event) => event?.is_approved)
          .filter((event) => event?.region === region)
          .filter((event) => {
            const eventDate = parseLocalDayjs(event.date);
            return eventDate.isValid() && eventDate.toDate().getTime() >= today.getTime();
          })
          .sort((a, b) => {
            const dateDiff = parseLocalDayjs(a.date).valueOf() - parseLocalDayjs(b.date).valueOf();
            if (dateDiff !== 0) return dateDiff;
            return String(a.start_time || '').localeCompare(String(b.start_time || ''));
          })
          .slice(0, 60)
      : [];

    return {
      props: {
        region,
        events,
        upcomingEventCount: events.length,
      },
    };
  } catch (error) {
    console.error('GSSP /events/[region] error:', error);
    return {
      props: {
        region,
        events: [],
        upcomingEventCount: 0,
      },
    };
  }
};
