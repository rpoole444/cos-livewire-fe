import { Event } from '@/interfaces/interfaces';

export const SITE_URL = 'https://app.alpinegrooveguide.com';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.alpinegrooveguide.com';
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/alpine_groove_guide_favicon.png`;

export const absoluteUrl = (pathOrUrl?: string | null): string | null => {
  const value = String(pathOrUrl || '').trim();
  if (!value || ['tbd', 'tba', 'none', 'null'].includes(value.toLowerCase())) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

export const truncateSeo = (value: string, maxLength = 160): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
};

export const getEventImageUrl = (event: Partial<Event>): string => (
  absoluteUrl(event.display_image_url || event.poster) || DEFAULT_SOCIAL_IMAGE
);

export const getEventCanonicalUrl = (slug: string): string => `${SITE_URL}/eventRouter/${slug}`;

export type SeoIndexabilityStatus = {
  shouldIndex: boolean;
  reason: string;
  robots: 'index,follow' | 'noindex,follow';
};

export const MIN_REGION_UPCOMING_EVENTS_FOR_INDEX = 3;

export const getSeoIndexabilityStatus = (pageContext: {
  kind: 'region-events' | 'artist-profile' | 'venue-profile' | 'event' | 'static';
  upcomingEventCount?: number;
  isShell?: boolean;
  isApproved?: boolean;
  hasCanonical?: boolean;
}): SeoIndexabilityStatus => {
  if (pageContext.hasCanonical === false) {
    return { shouldIndex: false, reason: 'missing_canonical', robots: 'noindex,follow' };
  }

  if (pageContext.isApproved === false) {
    return { shouldIndex: false, reason: 'not_approved', robots: 'noindex,follow' };
  }

  if (pageContext.isShell) {
    return { shouldIndex: false, reason: 'shell_profile', robots: 'noindex,follow' };
  }

  if (
    pageContext.kind === 'region-events' &&
    Number(pageContext.upcomingEventCount || 0) < MIN_REGION_UPCOMING_EVENTS_FOR_INDEX
  ) {
    return { shouldIndex: false, reason: 'low_inventory', robots: 'noindex,follow' };
  }

  return { shouldIndex: true, reason: 'indexable', robots: 'index,follow' };
};

const getDateOnly = (value?: string | null): string | undefined => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return undefined;
  return trimmed.includes('T') ? trimmed.split('T')[0] : trimmed;
};

export const buildWebsiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Alpine Groove Guide',
  url: SITE_URL,
  description: 'Community-powered live music calendar for Colorado’s Front Range and beyond.',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/?region=all-front-range&q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export const buildOrganizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Alpine Groove Guide',
  url: SITE_URL,
  logo: `${SITE_URL}/logo_horizontal.svg`,
  sameAs: [],
});

export const buildBreadcrumbJsonLd = (
  items: Array<{ name: string; url: string }>
) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const buildEventJsonLd = (event: Event) => {
  const eventUrl = getEventCanonicalUrl(event.slug);
  const venueName =
    event.venue_profile_display_name ||
    event.venue_name ||
    event.location ||
    'Venue TBA';
  const addressParts = [
    event.venue_profile_address || event.address,
    event.venue_profile_city,
    event.venue_profile_state,
    event.venue_profile_postal_code,
  ].filter(Boolean);
  const description = truncateSeo(
    event.description ||
      [venueName, event.date, event.genre].filter(Boolean).join(' • ') ||
      'Live music event listed on Alpine Groove Guide.'
  );
  const dateOnly = getDateOnly(event.date);
  const startDate = dateOnly && event.start_time
    ? `${dateOnly}T${event.start_time}`
    : event.date;
  const endDate = dateOnly && event.end_time
    ? `${dateOnly}T${event.end_time}`
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: event.title,
    url: eventUrl,
    description,
    image: [getEventImageUrl(event)],
    startDate,
    ...(endDate ? { endDate } : {}),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: venueName,
      ...(addressParts.length
        ? {
            address: {
              '@type': 'PostalAddress',
              streetAddress: event.venue_profile_address || event.address || undefined,
              addressLocality: event.venue_profile_city || undefined,
              addressRegion: event.venue_profile_state || undefined,
              postalCode: event.venue_profile_postal_code || undefined,
            },
          }
        : {}),
      ...(event.venue_profile_website ? { url: absoluteUrl(event.venue_profile_website) || undefined } : {}),
    },
    ...(event.claimed_artist
      ? {
          performer: {
            '@type': event.claimed_artist.profile_type === 'venue' ? 'Organization' : 'MusicGroup',
            name: event.claimed_artist.display_name,
            url: `${SITE_URL}/artists/${event.claimed_artist.slug}`,
          },
        }
      : {}),
    organizer: {
      '@type': 'Organization',
      name: event.source_label || 'Alpine Groove Guide',
      url: SITE_URL,
    },
    ...(event.website_link || event.website
      ? { offers: { '@type': 'Offer', url: absoluteUrl(event.website_link || event.website) || eventUrl } }
      : {}),
  };
};

export const buildProfileJsonLd = (profile: {
  display_name: string;
  slug: string;
  bio?: string | null;
  profile_image?: string | null;
  profile_type?: 'artist' | 'venue' | 'promoter' | string;
  website?: string | null;
  genres?: string[];
  home_region?: string | null;
  venue_address?: string | null;
  venue_city?: string | null;
  venue_state?: string | null;
  venue_postal_code?: string | null;
  venue_phone?: string | null;
}) => {
  const isVenue = profile.profile_type === 'venue';
  const profileUrl = `${SITE_URL}/artists/${profile.slug}`;
  const image = absoluteUrl(profile.profile_image) || DEFAULT_SOCIAL_IMAGE;
  const description = truncateSeo(
    profile.bio ||
      (isVenue
        ? `${profile.display_name} is a live music venue listed on Alpine Groove Guide.`
        : `${profile.display_name} is an artist listed on Alpine Groove Guide.`)
  );

  if (isVenue) {
    return {
      '@context': 'https://schema.org',
      '@type': 'MusicVenue',
      name: profile.display_name,
      url: profileUrl,
      image,
      description,
      ...(profile.website ? { sameAs: [absoluteUrl(profile.website)].filter(Boolean) } : {}),
      ...(profile.venue_phone ? { telephone: profile.venue_phone } : {}),
      address: {
        '@type': 'PostalAddress',
        streetAddress: profile.venue_address || undefined,
        addressLocality: profile.venue_city || undefined,
        addressRegion: profile.venue_state || undefined,
        postalCode: profile.venue_postal_code || undefined,
      },
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': profile.profile_type === 'promoter' ? 'Organization' : 'MusicGroup',
    name: profile.display_name,
    url: profileUrl,
    image,
    description,
    genre: profile.genres || [],
    ...(profile.website ? { sameAs: [absoluteUrl(profile.website)].filter(Boolean) } : {}),
  };
};

export const buildItemListJsonLd = (
  name: string,
  items: Array<{ name: string; url: string }>
) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    url: item.url,
  })),
});
