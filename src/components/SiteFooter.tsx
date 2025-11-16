import Link from "next/link";

const SiteFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-slate-200 transition">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-slate-200 transition">
            Privacy
          </Link>
          <Link href="/contact" className="hover:text-slate-200 transition">
            Contact
          </Link>
        </div>
        <div className="text-[11px] sm:text-xs text-slate-500">
          © {year} Alpine Groove Guide. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
