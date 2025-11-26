export type MediaProvider = 'youtube' | 'bandcamp' | 'soundcloud';

interface ParseResult {
  embedUrl: string;
  error: string;
}

const EMPTY_RESULT: ParseResult = { embedUrl: '', error: '' };

const extractIframeSrc = (input: string): string | null => {
  const match = input.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : null;
};

const normalizeYouTubeUrl = (input: string): string | null => {
  try {
    const url = new URL(input);
    const host = url.hostname.replace('www.', '');

    if (host === 'youtu.be') {
      const videoId = url.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host.endsWith('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) {
        return `https://www.youtube.com${url.pathname}`;
      }

      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (url.pathname.startsWith('/shorts/')) {
        const videoId = url.pathname.split('/')[2];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
    }
  } catch {
    return null;
  }
  return null;
};

const normalizeSoundCloudUrl = (input: string): string | null => {
  try {
    const url = new URL(input);
    if (!url.hostname.includes('soundcloud.com') && !url.hostname.includes('snd.sc')) {
      return null;
    }
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      url.toString()
    )}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`;
  } catch {
    return null;
  }
};

const isBandcampUrl = (input: string): boolean => {
  try {
    const url = new URL(input);
    return url.hostname.includes('bandcamp.com');
  } catch {
    return false;
  }
};

/**
 * Accepts either a raw URL or a pasted iframe snippet and returns a cleaned embed URL.
 * Keeps backend contracts intact by only returning the src value we should persist.
 */
export const parseMediaInput = (
  input: string,
  provider: MediaProvider
): ParseResult => {
  if (!input.trim()) {
    return EMPTY_RESULT;
  }

  const trimmed = input.trim();
  const maybeIframeSrc = trimmed.toLowerCase().includes('<iframe')
    ? extractIframeSrc(trimmed)
    : trimmed;

  if (!maybeIframeSrc) {
    return { embedUrl: '', error: "This doesn't look like a valid embed code." };
  }

  switch (provider) {
    case 'youtube': {
      const embedUrl = normalizeYouTubeUrl(maybeIframeSrc);
      return embedUrl
        ? { embedUrl, error: '' }
        : { embedUrl: '', error: "This doesn't look like a valid YouTube link." };
    }
    case 'soundcloud': {
      if (maybeIframeSrc.includes('w.soundcloud.com/player/')) {
        return { embedUrl: maybeIframeSrc, error: '' };
      }
      const embedUrl = normalizeSoundCloudUrl(maybeIframeSrc);
      return embedUrl
        ? { embedUrl, error: '' }
        : { embedUrl: '', error: "This doesn't look like a valid SoundCloud link." };
    }
    case 'bandcamp': {
      if (maybeIframeSrc.includes('bandcamp.com/EmbeddedPlayer')) {
        return { embedUrl: maybeIframeSrc, error: '' };
      }
      return isBandcampUrl(maybeIframeSrc)
        ? { embedUrl: maybeIframeSrc, error: '' }
        : { embedUrl: '', error: "This doesn't look like a valid Bandcamp link." };
    }
    default:
      return { embedUrl: '', error: 'Unsupported provider.' };
  }
};
