import { DEFAULT_EVENT_POSTER } from '@/constants/media';

type Posterish = {
  poster?: string | null;
  poster_url?: string | null;
  display_image_url?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
};

const EMPTY_IMAGE_VALUES = new Set(['', 'tbd', 'tba', 'n/a', 'na', 'none', 'null', 'undefined']);
const DIRECT_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg']);
const NON_IMAGE_HOST_PATTERNS = [
  /(^|\.)eventbrite\.com$/i,
  /(^|\.)facebook\.com$/i,
  /(^|\.)fb\.me$/i,
  /(^|\.)instagram\.com$/i,
  /(^|\.)ticketmaster\.com$/i,
  /(^|\.)ticketsauce\.com$/i,
  /(^|\.)bandsintown\.com$/i,
  /(^|\.)google\.com$/i,
  /(^|\.)docs\.google\.com$/i,
  /(^|\.)drive\.google\.com$/i,
];

const cleanImageValue = (value?: string | null) => {
  const trimmed = String(value || '').trim();
  if (EMPTY_IMAGE_VALUES.has(trimmed.toLowerCase())) return null;
  return trimmed || null;
};

const hasDirectImageExtension = (pathname: string) => {
  const extension = pathname.split('/').pop()?.split('.').pop()?.toLowerCase();
  return Boolean(extension && DIRECT_IMAGE_EXTENSIONS.has(extension));
};

export function isLikelyDirectImageUrl(value?: string | null): boolean {
  const cleaned = cleanImageValue(value);
  if (!cleaned) return false;
  if (cleaned.startsWith('/')) return hasDirectImageExtension(cleaned);
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== 'https:') return false;
    if (NON_IMAGE_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname))) return false;
    return hasDirectImageExtension(parsed.pathname);
  } catch {
    return false;
  }
}

export function getEventImageSrc(input?: Posterish | string | null): string {
  if (!input) return DEFAULT_EVENT_POSTER;
  if (typeof input === 'string') {
    return isLikelyDirectImageUrl(input) ? input.trim() : DEFAULT_EVENT_POSTER;
  }

  const candidate = (
    input.display_image_url ||
    input.imageUrl ||
    input.image_url ||
    input.poster_url ||
    input.poster ||
    DEFAULT_EVENT_POSTER
  );
  return isLikelyDirectImageUrl(candidate) ? candidate.trim() : DEFAULT_EVENT_POSTER;
}

export const EVENT_PLACEHOLDER = DEFAULT_EVENT_POSTER;
