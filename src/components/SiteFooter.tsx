import Link from "next/link";
import Image from "next/image";

const SiteFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gold/40 bg-black">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-xs text-ivory/60 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Image src="/icon_mark.svg" alt="" width={54} height={54} className="h-12 w-12 object-contain" />
          <div>
            <p className="agg-display text-sm font-semibold text-sun-gold">THE SOUND OF THE FRONT RANGE</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-alpine">Local music. Human-curated.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/about" className="transition hover:text-sun-gold">
            About Alpine Groove Guide
          </Link>
          <Link href="/terms" className="transition hover:text-sun-gold">
            Terms
          </Link>
          <Link href="/privacy" className="transition hover:text-sun-gold">
            Privacy
          </Link>
          <Link href="/contact" className="transition hover:text-sun-gold">
            Contact
          </Link>
        </div>
        <div className="text-[11px] text-ivory/40 sm:text-xs">
          © {year} Alpine Groove Guide. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
