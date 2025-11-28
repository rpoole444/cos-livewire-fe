import { DEFAULT_EVENT_POSTER } from '@/constants/media';

type Posterish = {
  poster?: string | null;
  poster_url?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
};

export function getEventImageSrc(input?: Posterish | string | null): string {
  if (!input) return DEFAULT_EVENT_POSTER;
  if (typeof input === 'string') return input || DEFAULT_EVENT_POSTER;

  return (
    input.imageUrl ||
    input.image_url ||
    input.poster_url ||
    input.poster ||
    DEFAULT_EVENT_POSTER
  );
}

export const EVENT_PLACEHOLDER = DEFAULT_EVENT_POSTER;
