import Head from 'next/head';
import Link from 'next/link';
import { BarChart3, CalendarDays, ClipboardCheck, Link2, Music2, Share2 } from 'lucide-react';
import { COMMUNITY_ARTIST_ACCESS_LABEL } from '@/util/communityAccess';

const artistTools = [
  {
    title: 'A public home for your shows',
    description: 'Keep your bio, genre, photos, links, booking contact, and upcoming dates in one artist-friendly page.',
    icon: Music2,
  },
  {
    title: 'Claim imported gigs',
    description: 'When a show is imported from Moondog or another calendar, request a claim so it connects to your profile after admin approval.',
    icon: ClipboardCheck,
  },
  {
    title: 'Embeddable schedule',
    description: 'Put your upcoming shows or Top Picks on your own website without maintaining the same calendar twice.',
    icon: CalendarDays,
  },
  {
    title: 'Better booking materials',
    description: 'Use your profile as a lightweight EPK with booking snapshot details, promo media, and links that help venues say yes faster.',
    icon: Share2,
  },
  {
    title: 'Private profile signals',
    description: 'Owner-only analytics and profile completeness help you understand what fans and bookers are actually clicking.',
    icon: BarChart3,
  },
  {
    title: 'One link for fans and venues',
    description: 'Send a clean Alpine link that points people to confirmed shows, music links, booking info, and your web presence.',
    icon: Link2,
  },
];

export default function ForArtistsPage() {
  return (
    <>
      <Head>
        <title>For Artists – Alpine Groove Guide</title>
        <meta
          name="description"
          content="Create an artist page, claim gigs, and share your upcoming shows across Colorado's Front Range."
        />
      </Head>
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">For artists</p>
            <h1 className="agg-display mt-4 text-4xl font-semibold text-sun-gold sm:text-5xl">
              Make every gig easier to find, share, and improve.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Alpine Groove Guide gives working musicians a public profile, an accurate show schedule, claim tools for imported listings,
              and simple embeds that keep your own website current.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/artist-signup?type=artist"
                className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-sun-gold"
              >
                Create artist page
              </Link>
              <Link
                href="/artists"
                className="inline-flex items-center justify-center rounded-full border border-gold/50 px-6 py-3 text-sm font-black uppercase tracking-wider text-sun-gold transition hover:border-sun-gold hover:text-ivory"
              >
                Browse artists
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              {COMMUNITY_ARTIST_ACCESS_LABEL}. No credit card required to start.
            </p>
          </div>

          <div className="agg-corner-frame border border-gold/40 bg-gradient-to-br from-[#171a12] via-black to-[#11130e] p-6 shadow-2xl shadow-black/40">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-alpine">Artist workflow</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">From imported listing to stronger public page</h2>
              <ol className="mt-6 space-y-4 text-sm text-slate-300">
                <li><strong className="text-sun-gold">1.</strong> A gig appears from an import, venue, or promoter.</li>
                <li><strong className="text-sun-gold">2.</strong> You request to claim it with your artist profile.</li>
                <li><strong className="text-sun-gold">3.</strong> Admin approves the claim.</li>
                <li><strong className="text-sun-gold">4.</strong> You improve the listing with better photos, copy, links, and details.</li>
              </ol>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {artistTools.map(({ title, description, icon: Icon }) => (
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
