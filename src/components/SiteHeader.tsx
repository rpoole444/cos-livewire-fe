import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Events" },
  { href: "/artists", label: "Artists" },
  { href: "/eventSubmission", label: "Submit Event" },
  { href: "/about", label: "About" },
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

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      key={href}
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition sm:text-sm ${
        isActive(href)
          ? "bg-slate-800/80 text-white"
          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/70 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-slate-900/60">
            <div className="relative h-8 w-8 sm:h-9 sm:w-9">
              <Image src="/alpine_groove_guide_icon.png" alt="Alpine Groove Guide" fill className="rounded-xl object-cover" />
            </div>
            <span className="text-sm font-semibold text-slate-50 sm:text-base">Alpine Groove Guide</span>
          </Link>
          <nav className="hidden items-center gap-2 sm:flex">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          {!user ? (
            <>
              <Link href="/LoginPage" className="text-xs font-semibold text-slate-300 hover:text-white sm:text-sm">
                Log In
              </Link>
              <Link
                href="/RegisterPage"
                className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 sm:text-sm"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/profile"
                className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 sm:text-sm"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-slate-300 hover:text-white sm:text-sm"
              >
                Log out
              </button>
            </>
          )}
        </div>

        <button
          className="text-slate-200 sm:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 sm:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                  isActive(link.href) ? "bg-slate-800/80 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4">
            {!user ? (
              <>
                <Link
                  href="/LoginPage"
                  className="text-sm font-semibold text-slate-300 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/RegisterPage"
                  className="rounded-full bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/profile"
                  className="rounded-full bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left text-sm font-semibold text-slate-300 hover:text-white"
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
