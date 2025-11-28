import Image from "next/image";
import { getEventImageSrc } from "@/util/getEventImageSrc";

type EventPosterProps = {
  posterUrl?: string | null;
  title?: string;
  className?: string;
  variant?: 'detail' | 'card' | 'square';
  fit?: 'cover' | 'contain';
};

/**
 * Renders either the real event poster or a stylized Alpine Groove Guide fallback
 * so events without artwork still feel intentional and on-brand.
 * QA: real posters fit ratio, placeholder fills container, no stretching, consistent card heights.
 */
const EventPoster = ({ posterUrl, title, className, variant = 'card', fit }: EventPosterProps) => {
  const aspectClass =
    variant === 'detail' ? 'aspect-[16/9]' : variant === 'square' ? 'aspect-square' : 'aspect-[4/5]';
  const baseClass =
    "relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900";
  const src = getEventImageSrc(posterUrl);
  // If posters are unusually wide, favor contain on detail views to keep artwork visible.
  const fitClass = (fit ?? (variant === 'detail' ? 'contain' : 'cover')) === 'contain' ? 'object-contain' : 'object-cover';

  return (
    <div className={`${baseClass} ${aspectClass} ${className ?? ""}`}>
      <Image
        src={src}
        alt={title ? `${title} poster` : "Event poster"}
        fill
        className={`h-full w-full ${fitClass}`}
        sizes="(max-width: 768px) 100vw, 400px"
      />
    </div>
  );
};

export default EventPoster;
