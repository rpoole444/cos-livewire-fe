import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, CalendarPlus } from 'lucide-react';

const HeroSection = ({ user }: { user: any; setAuthMode: (mode: string) => void }) => {
  const handleBrowse = () => {
    if (typeof window === 'undefined') return;
    const target = document.getElementById('events');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const createShowLink = user ? '/eventSubmission' : '/LoginPage?redirect=/eventSubmission';

  return (
    <section className="relative overflow-hidden border-b border-gold/40 bg-black text-ivory">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_40%,rgba(201,150,46,0.13),transparent_34%),radial-gradient(circle_at_18%_10%,rgba(79,120,112,0.16),transparent_28%)]" />
      <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)] lg:px-8 lg:py-20">
        <div className="relative z-10 space-y-7 text-left">
          <p className="text-xs font-black uppercase tracking-[0.42em] text-alpine">Colorado Front Range</p>
          <div className="space-y-3">
            <h1 className="agg-display agg-text-shadow text-5xl font-semibold leading-[0.98] text-sun-gold sm:text-6xl lg:text-7xl">
              Find the
              <span className="block text-ivory">good set.</span>
            </h1>
            <div className="h-px w-40 bg-copper" />
          </div>
          <p className="max-w-xl text-base leading-7 text-ivory/75 sm:text-lg">
            Discover live music across Colorado’s Front Range and nearby southern Colorado music communities.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleBrowse}
              className="inline-flex items-center justify-center gap-2 border border-gold bg-gold px-6 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-sun-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun-gold"
            >
              Browse the calendar
              <ArrowDown className="h-4 w-4" />
            </button>
            <Link
              href={createShowLink}
              className="inline-flex items-center justify-center gap-2 border border-alpine px-6 py-3 text-center text-sm font-black uppercase tracking-wider text-ivory transition hover:border-sun-gold hover:text-sun-gold"
            >
              Add your show
              <CalendarPlus className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-ivory/45">
            Artist pages • Regional gigs • Real humans
          </p>
        </div>

        <div className="relative flex w-full items-center justify-center">
          <div className="agg-corner-frame relative aspect-square w-full max-w-[570px] border border-gold/40 bg-[#080906]/70 p-5 shadow-2xl shadow-black/60 sm:p-8">
            <div className="absolute inset-3 border border-gold/20" />
            <Image
              src="/logo_primary_stacked.svg"
              alt="Alpine Groove Guide"
              fill
              priority
              className="object-contain p-9 sm:p-12"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
