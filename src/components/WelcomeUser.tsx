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
    <section className="flex h-full flex-col rounded-3xl bg-slate-950 px-6 py-6 text-slate-50 shadow-2xl shadow-black/40 ring-1 ring-slate-800">
      <div className="flex h-full flex-col gap-5 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-emerald-400">WELCOME BACK</p>
          <h2 className="text-xl font-bold leading-tight text-slate-50 sm:text-2xl">
            Hey {greetingName}, let&apos;s get your music in front of fans.
          </h2>
          <p className="text-sm text-slate-400">
            Submit shows, update your artist presence, or explore admin tools without leaving this dashboard.
          </p>
        </header>

        <div className="space-y-4 rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-100">
            <span
              className={`rounded-full border px-3 py-0.5 text-xs uppercase tracking-wide ${
                isPro
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-purple-400/40 bg-purple-500/15 text-purple-100'
              }`}
            >
              {isPro ? 'Alpine Pro' : 'Community Member'}
            </span>
            {trialEndsSoon && !isPro && (
              <span className="text-xs text-slate-400">Trial ends {trialEndsSoon}</span>
            )}
          </div>
          {topGenres.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Your top styles</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {topGenres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-slate-700/80 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-100"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="text-sm text-slate-300">
            <p className="font-semibold text-slate-50">Next up</p>
            <p className="mt-1 text-slate-400">
              Share your next gig or polish your artist page so bookers know exactly what you bring to the stage.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/eventSubmission"
            className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-3 text-center text-sm font-medium text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/20 hover:text-white"
          >
            Submit a live music event →
          </Link>
          <Link
            href="/UserProfile"
            className="rounded-full border border-slate-700 bg-slate-900 px-4 py-3 text-center text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Manage profile &amp; artist pages →
          </Link>
        </div>

        {user?.is_admin && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/AdminUsersPage"
              className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 text-center text-sm font-medium text-indigo-200 transition hover:border-indigo-300 hover:text-white"
            >
              Admin users
            </Link>
            <Link
              href="/AdminService"
              className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-center text-sm font-medium text-cyan-100 transition hover:border-cyan-300 hover:text-white"
            >
              Review submissions
            </Link>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="rounded-full border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 transition hover:border-red-400 hover:bg-red-500/20"
        >
          Logout
        </button>
      </div>
    </section>
  );
};

export default WelcomeUser;
