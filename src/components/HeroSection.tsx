import React from 'react';
import Link from 'next/link';

const sampleShows = [
  { title: 'Moonlit Vinyl', venue: 'The Lodge · Denver', time: 'Tonight · 9:00 PM', genre: 'Indie Groove' },
  { title: 'High Country Jazz Jam', venue: 'Gold Room · COS', time: 'Fri · 8:00 PM', genre: 'Jazz' },
  { title: 'Bass Camp Afterhours', venue: 'Underground · Boulder', time: 'Sat · 11:30 PM', genre: 'Electronic' },
];

const HeroSection = ({ user }: { user: any; setAuthMode: (mode: string) => void }) => {
  const handleBrowse = () => {
    if (typeof window === 'undefined') return;
    const target = document.getElementById('events');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const createShowLink = user ? '/eventSubmission' : '/LoginPage?redirect=/eventSubmission';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:py-20 lg:flex-row lg:items-center lg:gap-12">
        <div className="flex-1 space-y-6 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">Colorado Front Range</p>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Live music, <span className="text-emerald-300">on one stage.</span>
          </h1>
          <p className="max-w-2xl text-base text-slate-200 sm:text-lg">
            Discover Colorado Front Range shows, and give artists and venues a home for their gigs. Alpine Groove Guide
            keeps every set time, ticket link, and local lineup in one elevated feed.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleBrowse}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-emerald-500/40 transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
            >
              Browse live music
            </button>
            <Link
              href={createShowLink}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 px-6 py-3 text-center text-sm font-semibold text-slate-100 transition hover:border-slate-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
            >
              Add your show
            </Link>
          </div>
        </div>

        <div className="flex w-full flex-1 items-center justify-center">
          <div className="relative w-full max-w-md space-y-4 rounded-3xl bg-slate-950/60 p-6 ring-1 ring-slate-800 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Now playing</p>
            <div className="space-y-4">
              {sampleShows.map((show, idx) => (
                <div
                  key={show.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg ring-1 ring-slate-900/40"
                  style={{ transform: `translateY(${idx * 6}px)` }}
                >
                  <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-200">{show.genre}</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{show.title}</h3>
                  <p className="text-sm text-slate-300">{show.venue}</p>
                  <p className="text-xs text-slate-500">{show.time}</p>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute -left-16 -top-8 hidden h-32 w-32 rounded-full bg-emerald-400/30 blur-3xl md:block" />
            <div className="pointer-events-none absolute -right-14 bottom-0 hidden h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
