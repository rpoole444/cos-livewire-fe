// pages/404.tsx
import Link from 'next/link';
import Head from 'next/head';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | Alpine Groove Guide</title>
      </Head>
      <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-16 text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(224,184,97,0.16),_transparent_58%)]" />
        <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-emerald-300">Alpine Groove Guide</p>
          <h1 className="mt-4 font-serif text-7xl font-bold text-sun-gold">404</h1>
          <p className="mt-4 text-2xl font-semibold text-slate-50">This page missed the set.</p>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
            The link may have moved, been deleted, or never existed. Head back to the calendar and find the next show.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-sun-gold"
            >
              Back to calendar
            </Link>
            <Link
              href="/artists"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-300 hover:text-white"
            >
              Browse directory
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
