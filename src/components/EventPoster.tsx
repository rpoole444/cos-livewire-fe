import Image from "next/image";
import { DEFAULT_EVENT_POSTER } from "@/constants/media";

type EventPosterProps = {
  posterUrl?: string | null;
  title?: string;
  className?: string;
  variant?: 'detail' | 'card' | 'square';
};

/**
 * Renders either the real event poster or a stylized Alpine Groove Guide fallback
 * so events without artwork still feel intentional and on-brand.
 * QA: real posters fit ratio, placeholder fills container, no stretching, consistent card heights.
 */
const EventPoster = ({ posterUrl, title, className, variant = 'card' }: EventPosterProps) => {
  const aspectClass =
    variant === 'detail' ? 'aspect-[16/9]' : variant === 'square' ? 'aspect-square' : 'aspect-[4/5]';
  const baseClass =
    "relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900";
  const src = posterUrl || DEFAULT_EVENT_POSTER;

  if (posterUrl) {
    return (
      <div className={`${baseClass} ${aspectClass} ${className ?? ""}`}>
        <Image
          src={src}
          alt={title ? `${title} poster` : "Event poster"}
          fill
          className="h-full w-full object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />
      </div>
    );
  }

  return (
    <div className={`${baseClass} ${aspectClass} ${className ?? ""}`}>
      <Image
        src={src}
        alt={title ? `${title} poster` : "Event poster"}
        fill
        className="h-full w-full object-cover"
        sizes="(max-width: 768px) 100vw, 400px"
      />
    </div>
  );
};

export default EventPoster;
