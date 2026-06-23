import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { UserType } from "@/types";
import { CalendarPlus, ClipboardList, Crown, LayoutDashboard, LogOut, Settings, ShieldCheck, Upload } from "lucide-react";

type WelcomeUserProps = {
  compact?: boolean;
};

const WelcomeUser = ({ compact = false }: WelcomeUserProps) => {
  const { user, logout } = useAuth() as { user: UserType | null; logout: () => void };
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
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
    return user.top_music_genres.filter(Boolean).slice(0, 6);
  }, [user?.top_music_genres]);

  const primaryActions = [
    {
      href: "/eventSubmission",
      label: "Submit event",
      description: "Add a show to the public calendar.",
      icon: CalendarPlus,
      className: "border-emerald-400/50 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300 hover:bg-emerald-500/20",
    },
    {
      href: "/UserProfile",
      label: "Manage profile",
      description: "Update account, Pro pages, and billing.",
      icon: Settings,
      className: "border-cyan-400/40 bg-cyan-500/10 text-cyan-100 hover:border-cyan-300 hover:bg-cyan-500/20",
    },
  ];

  const adminActions = [
    { href: "/AdminService", label: "Review submissions", icon: ClipboardList },
    { href: "/AdminUsersPage", label: "Admin users", icon: ShieldCheck },
    { href: "/admin/import", label: "Import batches", icon: Upload },
  ];

  if (compact) {
    return (
      <section className="rounded-3xl border border-slate-800/80 bg-slate-950/85 p-4 text-slate-50 shadow-xl shadow-black/30 backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <header className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-400">Welcome back</p>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                  isPro
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-purple-400/40 bg-purple-500/15 text-purple-100'
                }`}
              >
                <Crown className="h-3.5 w-3.5" />
                {isPro ? 'Alpine Pro' : 'Community Member'}
              </span>
              {user?.is_admin && (
                <Link
                  href="/AdminService"
                  className="inline-flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-100 transition hover:border-indigo-300"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin tools
                </Link>
              )}
            </div>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-slate-50 sm:text-2xl">
              Hey {greetingName}, manage your music presence.
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Submit shows, update Pro pages, and review admin work without crowding the calendar.
            </p>
          </header>

          <div className="grid gap-2 sm:grid-cols-2 xl:w-[360px]">
            {primaryActions.map(({ href, label, icon: Icon, className }) => (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:text-white ${className}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {user?.is_admin && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-800/80 pt-3">
            {adminActions.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-slate-950/50 px-3 py-2 text-xs font-medium text-indigo-100 transition hover:border-indigo-300/60 hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="flex min-h-[720px] flex-col rounded-3xl border border-slate-800/80 bg-slate-950/85 px-6 py-6 text-slate-50 shadow-2xl shadow-black/40 backdrop-blur lg:min-h-[calc(100vh-7rem)]">
      <div className="flex flex-1 flex-col gap-5">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold tracking-[0.28em] text-emerald-400">WELCOME BACK</p>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </span>
          </div>
          <h2 className="text-xl font-semibold leading-tight text-slate-50 sm:text-2xl">
            Hey {greetingName}, let&apos;s get your music in front of fans.
          </h2>
          <p className="text-sm text-slate-400">
            Submit shows, update your artist presence, or explore admin tools without leaving this dashboard.
          </p>
        </header>

        <div className="space-y-4 rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-100">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
                isPro
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-purple-400/40 bg-purple-500/15 text-purple-100'
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
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
              Share your next gig or polish your Pro page so bookers know exactly what you bring to the stage.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {primaryActions.map(({ href, label, description, icon: Icon, className }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-2xl border px-4 py-4 text-left transition hover:text-white ${className}`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4" />
                {label}
              </span>
              <span className="mt-1 block text-xs leading-5 opacity-80">{description}</span>
            </Link>
          ))}
        </div>

        {user?.is_admin && (
          <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">Admin tools</p>
            <div className="mt-3 grid gap-2">
              {adminActions.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-2xl border border-indigo-400/20 bg-slate-950/50 px-4 py-3 text-sm font-medium text-indigo-100 transition hover:border-indigo-300/60 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto rounded-3xl border border-slate-800/70 bg-slate-900/60 p-4 text-sm text-slate-300">
          <p className="font-semibold text-slate-100">Quick check</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Keep event dates, venues, ticket links, and profile media current so fans can trust the guide.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 transition hover:border-red-400 hover:bg-red-500/20"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </section>
  );
};

export default WelcomeUser;
