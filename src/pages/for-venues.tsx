import Head from 'next/head';
import Link from 'next/link';
import { Building2, CalendarDays, ClipboardList, MapPin, Radio, Share2 } from 'lucide-react';
import { COMMUNITY_ARTIST_ACCESS_LABEL } from '@/util/communityAccess';

const venueTools = [
  {
    title: 'A venue page fans can actually use',
    description: 'Show address, region, age policy, capacity, booking contact, music styles, and upcoming shows in one clean public profile.',
    icon: MapPin,
  },
  {
    title: 'A calendar that follows your room',
    description: 'Approved shows can appear on your venue profile and in an embeddable schedule for your own website.',
    icon: CalendarDays,
  },
  {
    title: 'Faster event submission',
    description: 'Venue accounts can prefill location, region, website, and age-policy details so recurring listings take less work.',
    icon: ClipboardList,
  },
  {
    title: 'Local discovery without ticketing-platform noise',
    description: 'Alpine Groove Guide is built around Front Range music discovery, not corporate event spam or unrelated nightlife clutter.',
    icon: Radio,
  },
];

export default function ForVenuesPage() {
  return (
    <>
      <Head>
        <title>For Venues – Alpine Groove Guide</title>
        <meta
          name="description"
          content="Claim a venue page and share your live music calendar across Colorado's Front Range."
        />
      </Head>
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">For venues</p>
            <h1 className="agg-display mt-4 text-4xl font-semibold text-sun-gold sm:text-5xl">
              Make your room easier to find, book, and follow.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Alpine Groove Guide gives Front Range venues a dedicated music profile, a regional calendar presence,
              and a simple way to keep fans current on what is happening on stage.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/venue-signup"
                className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-sun-gold"
              >
                Claim your venue page
              </Link>
              <Link
                href="/venues/colorado-springs"
                className="inline-flex items-center justify-center rounded-full border border-gold/50 px-6 py-3 text-sm font-black uppercase tracking-wider text-sun-gold transition hover:border-sun-gold hover:text-ivory"
              >
                Browse venues
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              {COMMUNITY_ARTIST_ACCESS_LABEL}. Venue pages can be claimed right now.
            </p>
          </div>

          <div className="agg-corner-frame border border-gold/40 bg-gradient-to-br from-[#171a12] via-black to-[#11130e] p-6 shadow-2xl shadow-black/40">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/50 bg-gold/10 text-sun-gold">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-alpine">Venue profile</p>
                  <h2 className="text-xl font-semibold text-white">Built for music rooms</h2>
                </div>
              </div>
              <div className="mt-6 space-y-4 text-sm text-slate-300">
                <p>
                  A venue page should answer two different questions quickly: “What is happening here?” for fans,
                  and “How do I work with this room?” for artists and promoters.
                </p>
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                  <p className="flex items-center gap-2 font-semibold text-emerald-100">
                    <Share2 className="h-4 w-4" />
                    Website calendar embed
                  </p>
                  <p className="mt-2 text-emerald-50/80">
                    Put your approved Alpine venue schedule on your own website so fans see fresh upcoming shows
                    without double-entry.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            {venueTools.map(({ title, description, icon: Icon }) => (
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
