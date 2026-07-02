import Head from "next/head";
import Link from "next/link";

const ContactPage = () => {
  return (
    <>
      <Head>
        <title>Contact – Alpine Groove Guide</title>
      </Head>
      <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-16 text-slate-50">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_58%)]" />
        <main className="mx-auto max-w-3xl">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-black/30">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-emerald-300">Contact</p>
            <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Need help with Alpine Groove Guide?</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Send event corrections, profile questions, venue claim notes, or partnership ideas. Keep it specific and
              include links when you can.
            </p>
            <a
              href="mailto:support@alpinegrooveguide.com"
              className="mt-6 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-black uppercase tracking-wider text-black transition hover:bg-sun-gold"
            >
              Email support
            </a>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href="/eventSubmission"
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-emerald-400/60"
            >
              <p className="font-semibold text-white">Submit a show</p>
              <p className="mt-2 text-sm text-slate-400">Add a public event to the review queue.</p>
            </Link>
            <Link
              href="/artists"
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-emerald-400/60"
            >
              <p className="font-semibold text-white">Find a profile</p>
              <p className="mt-2 text-sm text-slate-400">Browse artists, venues, and promoter pages.</p>
            </Link>
          </section>
        </main>
      </div>
    </>
  );
};

export default ContactPage;
