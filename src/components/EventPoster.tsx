import Image from "next/image";
import { DEFAULT_EVENT_POSTER } from "@/constants/media";

type EventPosterProps = {
  posterUrl?: string | null;
  title?: string;
  className?: string;
};

/**
 * Renders either the real event poster or a stylized Alpine Groove Guide fallback
 * so events without artwork still feel intentional and on-brand.
 */
const EventPoster = ({ posterUrl, title, className }: EventPosterProps) => {
  const baseClass =
    "relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900";

  if (posterUrl) {
    return (
      <div className={`${baseClass} ${className ?? ""}`}>
        <Image
          src={posterUrl}
          alt={title ? `${title} poster` : "Event poster"}
          fill
          className="h-full w-full object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />
      </div>
    );
  }

  return (
    <div className={`${baseClass} ${className ?? ""}`}>
      <div className="absolute inset-0">
        <Image
          src={DEFAULT_EVENT_POSTER}
          alt="Alpine Groove Guide background"
          fill
          className="object-cover opacity-40 blur-3xl scale-125"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-emerald-700/60" />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-center">
        <Image
          src={DEFAULT_EVENT_POSTER}
          alt="Alpine Groove Guide event"
          width={160}
          height={160}
          className="rounded-2xl shadow-lg"
        />
        <p className="mt-4 px-4 text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-200/80">
          Alpine Groove Guide Event
        </p>
      </div>
    </div>
  );
};

export default EventPoster;
