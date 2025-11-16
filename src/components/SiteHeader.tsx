import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Events" },
  { href: "/artists", label: "Artists" },
  { href: "/eventSubmission", label: "Submit Event" },
];

const SiteHeader = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return router.pathname === "/";
    return router.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-white tracking-tight">
            Alpine Groove Guide
          </Link>
          <nav className="hidden sm:flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition ${
                  isActive(link.href)
                    ? "text-white border-b-2 border-emerald-400 pb-1"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          {!user ? (
            <>
              <Link href="/LoginPage" className="text-sm text-slate-300 hover:text-white transition">
                Log In
              </Link>
              <Link
                href="/RegisterPage"
                className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold text-slate-950 transition"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/profile"
                className="text-sm font-semibold text-white px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                Log out
              </button>
            </>
          )}
        </div>

        <button
          className="sm:hidden text-slate-200"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-4">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base font-medium transition ${
                  isActive(link.href) ? "text-white" : "text-slate-300 hover:text-white"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
            {!user ? (
              <>
                <Link
                  href="/LoginPage"
                  className="text-sm text-slate-300 hover:text-white transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/RegisterPage"
                  className="px-3 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold text-slate-950 transition text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/profile"
                  className="px-3 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-white transition text-left"
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
