import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import SupportTipSection from "@/components/SupportTipSection";

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

        <section className="space-y-6 text-slate-200 max-w-3xl mx-auto">
          <div className="space-y-4">
            <p className="text-emerald-300 font-semibold">About Reid Poole</p>
            <p>
              I’m a musician, educator, and full-stack engineer who believes a city’s strength is reflected in its arts community. After spending a decade immersed in the New Orleans music scene — performing nightly, leading bands, and teaching the next generation — I returned to Colorado determined to help the Front Range grow a more connected, supported, and sustainable arts ecosystem.
            </p>
            <p>
              Alpine Groove Guide is the result of that commitment. I built it to solve a simple problem that affects every artist and venue I know: visibility. When artists are easier to discover, venues are easier to navigate, and audiences know what’s happening, an entire culture becomes stronger. AGG is my way of putting real tools into the hands of the people shaping our scene — musicians, venues, presenters, educators, and the community that supports them.
            </p>
            <p>
              My background spans twenty years of performing, arranging, teaching, and building creative communities, paired with hands-on engineering work in React, Next.js, Node, and modern web systems. But at the core, I’m someone who wants this region — Colorado Springs, Manitou Springs, Pueblo, the Tri-Lakes area, Castle Rock, and beyond — to have the thriving arts identity it deserves.
            </p>
            <p>
              I believe in building platforms that lift people up. I believe in scenes where musicians aren’t isolated but connected. And I believe that a strong arts community doesn’t appear on its own — it’s built piece by piece, by people who care enough to do the work.
            </p>
            <p>
              If you’re reading this, I hope you’ll be part of it. Come find me at a show, a jam session, or somewhere between code commits. I’m always excited to talk about the music and the city we’re building together.
            </p>
          </div>
        </section>

        <section className="flex flex-col items-center gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:flex-row sm:items-center sm:gap-8">
          <Image
            src="/reid_poole.jpeg"
            alt="Reid Poole"
            width={176}
            height={176}
            className="h-40 w-40 rounded-2xl object-cover shadow-2xl ring-1 ring-slate-700"
          />
          {/* TODO: Replace portrait image */}
          <div>
            <h2 className="text-2xl font-semibold text-white">Reid Poole</h2>
            <p className="text-slate-400">Musician • Bandleader • Software Engineer</p>
            <p className="mt-1 text-sm text-slate-500">Founder, Alpine Groove Guide</p>
          </div>
        </section>

        <SupportTipSection
          source="public"
          buttonLabel="Tip Alpine Groove Guide"
          className="shadow-2xl"
        />

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
