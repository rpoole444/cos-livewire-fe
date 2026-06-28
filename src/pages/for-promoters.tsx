import Head from 'next/head';
import Link from 'next/link';
import { CalendarPlus, ClipboardList, Megaphone, SearchCheck, Sparkles, Users } from 'lucide-react';
import { COMMUNITY_ARTIST_ACCESS_LABEL } from '@/util/communityAccess';

const promoterTools = [
  {
    title: 'Submit repeatable show info faster',
    description: 'Use Alpine as a clean intake point for dates, venues, ticket links, lineup details, and public notes.',
    icon: CalendarPlus,
  },
  {
    title: 'Make imported calendars useful',
    description: 'Bulk imports can seed the calendar, then artists and venues can claim and improve individual listings.',
    icon: ClipboardList,
  },
  {
    title: 'Help fans trust the details',
    description: 'Quality checks highlight missing poster art, ticket links, venue info, region, and artist/profile connections.',
    icon: SearchCheck,
  },
  {
    title: 'Promote the scene, not just one show',
    description: 'Promoter pages can become a home for recurring series, showcases, and local music discovery across the Front Range.',
    icon: Megaphone,
  },
  {
    title: 'Connect artists and rooms',
    description: 'Claim workflows let artists take ownership of their gigs without creating duplicate events.',
    icon: Users,
  },
  {
    title: 'Keep the calendar human',
    description: 'Alpine is built for local music context, not generic event spam or ticketing-platform clutter.',
    icon: Sparkles,
  },
];

export default function ForPromotersPage() {
  return (
    <>
      <Head>
        <title>For Promoters – Alpine Groove Guide</title>
        <meta
          name="description"
          content="Promote recurring shows, imported calendars, and local music series on Alpine Groove Guide."
        />
      </Head>
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">For promoters</p>
            <h1 className="agg-display mt-4 text-4xl font-semibold text-sun-gold sm:text-5xl">
              Turn scattered show info into a trusted local calendar.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Alpine Groove Guide gives promoters and calendar builders a practical way to submit shows, import batches,
              avoid duplicates, and let artists improve the listings after admin-approved claims.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/artist-signup?type=promoter"
                className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-sun-gold"
              >
                Create promoter page
              </Link>
              <Link
                href="/admin/import"
                className="inline-flex items-center justify-center rounded-full border border-gold/50 px-6 py-3 text-sm font-black uppercase tracking-wider text-sun-gold transition hover:border-sun-gold hover:text-ivory"
              >
                Import calendar
              </Link>
              <Link
                href="/weekly-poster"
                className="inline-flex items-center justify-center rounded-full border border-emerald-300/50 px-6 py-3 text-sm font-black uppercase tracking-wider text-emerald-100 transition hover:border-emerald-200 hover:text-white"
              >
                Weekly poster
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              {COMMUNITY_ARTIST_ACCESS_LABEL}. Promoter pages can be created while access is open.
            </p>
          </div>

          <div className="agg-corner-frame border border-gold/40 bg-gradient-to-br from-[#171a12] via-black to-[#11130e] p-6 shadow-2xl shadow-black/40">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-alpine">Promoter workflow</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Coverage first, polish second</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Imported or promoter-created listings can start simple. The claim flow lets artists attach themselves later,
                replace generic imagery, and improve public details without making duplicate events.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {promoterTools.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                <Icon className="h-6 w-6 text-emerald-300" />
                <h2 className="mt-4 text-xl font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
