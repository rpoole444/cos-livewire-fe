import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const About = () => {
  const { user } = useAuth();
  const [artistSlug, setArtistSlug] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchArtistProfile = async () => {
      if (!user) {
        if (isMounted) {
          setArtistSlug(null);
        }
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/artists/mine`, {
          credentials: "include",
        });
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.artist && !data.artist.deleted_at) {
            setArtistSlug(data.artist.slug ?? null);
          } else {
            setArtistSlug(null);
          }
        } else {
          setArtistSlug(null);
        }
      } catch (error) {
        console.error("[About] artist check failed", error);
        if (isMounted) setArtistSlug(null);
      }
    };

    fetchArtistProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const loggedIn = Boolean(user);
  const hasArtistProfile = loggedIn && Boolean(artistSlug);

  const ctaHref = !loggedIn
    ? "/login?next=/artist-signup"
    : hasArtistProfile
      ? `/artists/${artistSlug}`
      : "/artist-signup";

  const ctaLabel = hasArtistProfile ? "Go to Pro Page" : "Create Your Pro Page";

  return (
    <>
      <Head>
        <title>About – Alpine Groove Guide</title>
      </Head>
    <div className="bg-slate-950 text-slate-50">
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 text-center shadow-2xl ring-1 ring-slate-800">
          <h1 className="text-4xl font-bold sm:text-5xl">About Alpine Groove Guide</h1>
          <p className="mt-4 text-sm text-slate-300 sm:text-base">
            Alpine Groove Guide is a community-powered calendar and artist platform dedicated to live music across the
            Colorado Front Range.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/eventSubmission"
              className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Submit your first show
            </Link>
            <Link
              href={ctaHref}
              className="rounded-full border border-slate-800 px-6 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-300 hover:text-white"
            >
              {ctaLabel}
            </Link>
          </div>
        </section>

        <section className="space-y-6 text-slate-200">
          <p>
            Welcome to <span className="text-emerald-300 font-semibold">Alpine Groove Guide</span> — a grassroots, curated
            feed of Colorado Springs, Denver, and Front Range gigs. Artists submit events, venues highlight their stages,
            and locals find shows that fit their vibe. Every listing is reviewed to keep the calendar accurate and trusted.
          </p>
          <p>
            I&apos;m <span className="text-emerald-300 font-semibold">Reid Poole</span> — trumpet player, bandleader, and
            software engineer. After two decades performing and teaching, I returned home to build tools that help working
            musicians connect with fans, venues, and each other in a single elevated experience.
          </p>
          <p>
            Alpine Groove Guide is my love letter to this community. Whether you&apos;re spinning jazz, experimenting with
            electronic textures, or fronting a punk outfit, there&apos;s space for you here.
          </p>
        </section>

        <section className="flex flex-col items-center gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:flex-row sm:items-center sm:gap-8">
          <Image
            src="/reid_poole.jpeg"
            alt="Reid Poole"
            width={176}
            height={176}
            className="h-40 w-40 rounded-2xl object-cover shadow-2xl ring-1 ring-slate-700"
          />
          <div>
            <h2 className="text-2xl font-semibold text-white">Reid Poole</h2>
            <p className="text-slate-400">Musician • Bandleader • Software Engineer</p>
            <p className="mt-1 text-sm text-slate-500">Founder, Alpine Groove Guide</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
          <h3 className="text-2xl font-semibold text-white">🎶 Get Involved</h3>
          <p className="mt-2 text-sm text-slate-300">
            Promote events, build a Pro page for your artist, venue, or series, or drop me a note if you have ideas to grow the scene.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/RegisterPage" className="rounded-full bg-indigo-500 px-5 py-2 text-center text-sm font-semibold text-white transition hover:bg-indigo-400">
              Create an account
            </Link>
            <Link href="/eventSubmission" className="rounded-full bg-emerald-500 px-5 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
              Submit an event
            </Link>
            <a
              href="mailto:poole.reid@gmail.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-slate-700 px-5 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-emerald-300 hover:text-white"
            >
              Contact me
            </a>
          </div>
        </section>

        <section className="border-t border-slate-800 pt-6 text-sm text-slate-400">
          <p>Follow Alpine Groove Guide:</p>
          <div className="mt-2 flex gap-4">
            <a href="https://www.instagram.com/reid_poole_music/" target="_blank" rel="noreferrer" className="hover:text-slate-100">
              Instagram
            </a>
            <a href="https://www.facebook.com/reidpoole" target="_blank" rel="noreferrer" className="hover:text-slate-100">
              Facebook
            </a>
            <a href="https://www.linkedin.com/in/reid-poole/" target="_blank" rel="noreferrer" className="hover:text-slate-100">
              LinkedIn
            </a>
          </div>
        </section>
      </main>
    </div>
    </>
  );
};

export default About;
