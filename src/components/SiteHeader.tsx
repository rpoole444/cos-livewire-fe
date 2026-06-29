import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Events" },
  { href: "/this-week", label: "This Week" },
  { href: "/artists", label: "Directory" },
  { href: "/for-artists", label: "For Artists" },
  { href: "/for-venues", label: "For Venues" },
  { href: "/for-promoters", label: "For Promoters" },
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
    try {
      await logout();
      setMenuOpen(false);
      await router.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      key={href}
      href={href}
      className={`border-b px-2 py-2 text-xs font-bold uppercase tracking-[0.12em] transition sm:text-[13px] ${
        isActive(href)
          ? "border-gold text-sun-gold"
          : "border-transparent text-ivory/70 hover:border-alpine hover:text-ivory"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-gold/40 bg-black/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="group flex min-w-0 items-center transition hover:opacity-90">
            <div className="relative h-12 w-40 sm:h-14 sm:w-48">
              <Image src="/logo_horizontal.svg" alt="Alpine Groove Guide" fill priority className="object-contain object-left" />
            </div>
          </Link>
          <nav className="hidden items-center gap-3 lg:flex">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          {!user ? (
            <>
              <Link href="/LoginPage" className="text-xs font-bold uppercase tracking-wider text-ivory/70 hover:text-sun-gold sm:text-sm">
                Log In
              </Link>
              <Link
                href="/RegisterPage"
                className="border border-gold bg-gold px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition hover:bg-sun-gold sm:text-sm"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/profile"
                className="border border-gold bg-gold px-4 py-2 text-xs font-black uppercase tracking-wider text-black transition hover:bg-sun-gold sm:text-sm"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs font-bold uppercase tracking-wider text-ivory/70 hover:text-sun-gold sm:text-sm"
              >
                Log out
              </button>
            </>
          )}
        </div>

        <button
          className="border border-gold/50 p-2 text-sun-gold sm:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-gold/30 bg-black px-4 py-4 sm:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`border-l-2 px-3 py-2 text-sm font-bold uppercase tracking-wider transition ${
                  isActive(link.href) ? "border-gold text-sun-gold" : "border-transparent text-ivory/70 hover:text-ivory"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3 border-t border-gold/30 pt-4">
            {!user ? (
              <>
                <Link
                  href="/LoginPage"
                  className="text-sm font-bold text-ivory/70 hover:text-sun-gold"
                  onClick={() => setMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/RegisterPage"
                  className="border border-gold bg-gold px-4 py-2 text-center text-sm font-black uppercase tracking-wider text-black transition hover:bg-sun-gold"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/profile"
                  className="border border-gold bg-gold px-4 py-2 text-center text-sm font-black uppercase tracking-wider text-black transition hover:bg-sun-gold"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left text-sm font-bold text-ivory/70 hover:text-sun-gold"
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
