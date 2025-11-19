import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { getEvents } from "../api/route";
import EventDetailCard from "@/components/EventDetailCard";
import WelcomeUser from "@/components/WelcomeUser";
import UpcomingShows from "@/components/UpcomingShows";
import LoginForm from "@/components/login";
import RegistrationForm from "@/components/registration";
import { Event } from "@/interfaces/interfaces";
import { useAuth } from "@/context/AuthContext";
import { FaFacebookF, FaTwitter, FaLink, FaLocationArrow, FaShareAlt } from "react-icons/fa";
import { useRouter } from "next/router";
import { fetchEventDetailsBySlug } from "../api/route"; // or wherever you define it


interface Props {
  event: Event;
  events: Event[];
}

const EventDetailPage = ({ event, events }: Props) => {
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const router = useRouter();

  const switchAuthMode = () => {
    setAuthMode((prev) => (prev === "login" ? "register" : "login"));
  };

  const getDirections = () => {
    if (!event?.address) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <Head>
        <title>{event.title} | Alpine Groove Guide</title>
        <meta name="description" content={event.description?.slice(0, 150)} />
        <link rel="canonical" href={`https://app.alpinegrooveguide.com/eventRouter/${event.slug}`} />
      </Head>

      <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_55%)]" />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:gap-12 lg:py-16">
          <section className="flex-1 space-y-6">
            <Link href="/" className="text-sm text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline">
              ← Back to all events
            </Link>
            <EventDetailCard event={event} user={user} expandDescription />
            {user && (user.id === event.user_id || user.is_admin) && (
              <Link
                href={`/events/edit/${event.id}`}
                className="inline-flex items-center justify-center rounded-lg border border-emerald-400/60 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-white"
              >
                Edit event
              </Link>
            )}

            {event.description && (
              <section className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-xl shadow-black/30 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">About this show</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300 whitespace-pre-line">{event.description}</p>
              </section>
            )}

            <section className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-xl shadow-black/30 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Spread the word</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {event.address && (
                  <button
                    onClick={getDirections}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0 sm:flex-none"
                  >
                    <FaLocationArrow /> Get directions
                  </button>
                )}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: event.title,
                        text: event.description?.slice(0, 100),
                        url: `https://app.alpinegrooveguide.com/share/${event.slug}`,
                      });
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-emerald-400/70 hover:bg-slate-900/60"
                >
                  <FaShareAlt /> Share
                </button>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    `https://app.alpinegrooveguide.com/share/${event.slug}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-emerald-400/70 hover:bg-slate-900/60"
                >
                  <FaFacebookF /> Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    `https://app.alpinegrooveguide.com/share/${event.slug}`,
                  )}&text=${encodeURIComponent(event.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-emerald-400/70 hover:bg-slate-900/60"
                >
                  <FaTwitter /> Share on X
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://app.alpinegrooveguide.com/share/${event.slug}`);
                    alert("Link copied to clipboard!");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-emerald-400/70 hover:bg-slate-900/60"
                >
                  <FaLink /> Copy link
                </button>
              </div>
            </section>
          </section>

          <aside className="w-full space-y-6 lg:w-[360px]">
            {user ? (
              <div className="space-y-6">
                <WelcomeUser />
                <UpcomingShows
                  user={user}
                  userGenres={
                    Array.isArray(user.top_music_genres)
                      ? user.top_music_genres
                      : JSON.parse(user.top_music_genres || "[]")
                  }
                  events={events}
                />
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-xl shadow-black/30">
                {authMode === "login" ? (
                  <div className="space-y-6">
                    <div className="space-y-2 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
                        Alpine Groove Guide
                      </p>
                      <h2 className="text-xl font-semibold text-slate-50">Welcome back</h2>
                      <p className="text-sm text-slate-400">
                        Sign in to RSVP, save shows, and submit your events.
                      </p>
                    </div>
                    <LoginForm setAuthMode={switchAuthMode} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
                        Alpine Groove Guide
                      </p>
                      <h2 className="text-xl font-semibold text-slate-50">Create an account</h2>
                      <p className="text-sm text-slate-400">
                        Build your artist profile and see your shows featured.
                      </p>
                    </div>
                    <RegistrationForm setAuthMode={switchAuthMode} />
                  </div>
                )}
                <button
                  onClick={switchAuthMode}
                  className="mt-6 w-full text-center text-xs text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
                >
                  {authMode === "login" ? "Need an account? Register" : "Already have an account? Login"}
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug;

  if (!slug || typeof slug !== "string") {
    console.warn("Invalid or missing event slug:", slug);
    return { notFound: true };
  }

  try {
    const event = await fetchEventDetailsBySlug(slug);
    const allEvents = await getEvents();

    if (!event || typeof event.id !== "number") {
      console.warn("Invalid event response");
      return { notFound: true };
    }

    return {
      props: {
        event,
        events: allEvents.filter((e: Event) => e.is_approved),
      },
    };
  } catch (err) {
    console.error("getServerSideProps failed:", err);
    return { notFound: true };
  }
};

export default EventDetailPage;
