import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef } from "react";
import { UserType } from "@/types";

const WelcomeUser = () => {
  const { user, logout } = useAuth() as { user: UserType | null; logout: () => void };
  const router = useRouter();
  const loggedRef = useRef(false);

  useEffect(() => {
    if (user && !loggedRef.current) {
      console.log("[WelcomeUser] rendering", {
        userId: user.id,
        displayName: user.displayName ?? user.display_name,
        isAdmin: user.is_admin,
        isPro: user.is_pro,
        trialEnds: user.trial_ends_at,
      });
      loggedRef.current = true;
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      logout();
      router.push("/");
    } catch (err) {
      console.error(err);
    }
  };

  const greetingName = user?.displayName || user?.display_name || user?.first_name || "there";
  const isPro = Boolean(user?.is_pro || user?.pro_active);
  const trialEndsSoon = user?.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString() : null;
  const topGenres = useMemo(() => {
    if (!user?.top_music_genres?.length) return [];
    return user.top_music_genres.filter(Boolean).slice(0, 4);
  }, [user?.top_music_genres]);

  return (
    <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-7 shadow-2xl shadow-slate-950/40">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Welcome back</p>
        <h2 className="text-2xl font-semibold text-white">Hey {greetingName}, let&apos;s get your music in front of fans.</h2>
        <p className="text-sm text-slate-400">
          Submit shows, update your artist presence, or explore admin tools without leaving this dashboard.
        </p>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isPro ? "bg-emerald-500/20 text-emerald-300" : "bg-purple-500/20 text-purple-200"}`}>
              {isPro ? "Alpine Pro" : "Community Member"}
            </span>
            {trialEndsSoon && !isPro && (
              <span className="text-xs text-slate-400">Trial ends {trialEndsSoon}</span>
            )}
          </div>
          {topGenres.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Your top styles
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {topGenres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs text-slate-200"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="text-sm text-slate-300">
            <p className="font-medium text-white">Next up</p>
            <p className="mt-1 text-slate-400">
              Share your next gig or polish your artist page so bookers know exactly what you bring to the stage.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <Link
            href="/eventSubmission"
            className="group flex w-full items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            Submit a live music event
            <span aria-hidden>&rarr;</span>
          </Link>

          <Link
            href="/UserProfile"
            className="group flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
          >
            Manage profile &amp; artist pages
            <span aria-hidden>&rarr;</span>
          </Link>

          {user?.is_admin && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/AdminUsersPage"
                className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-center text-sm font-medium text-indigo-200 transition hover:border-indigo-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
              >
                Admin users
              </Link>
              <Link
                href="/AdminService"
                className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-center text-sm font-medium text-cyan-200 transition hover:border-cyan-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              >
                Review submissions
              </Link>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:border-red-400 hover:bg-red-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
          >
            Logout
          </button>
        </div>
      </div>
    </section>
  );
};

export default WelcomeUser;
