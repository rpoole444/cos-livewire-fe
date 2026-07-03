type EventLocationish = {
  venue_name?: string | null;
  venue_profile_display_name?: string | null;
  location?: string | null;
  address?: string | null;
  venue_profile_address?: string | null;
  venue_profile_city?: string | null;
  venue_profile_state?: string | null;
  venue_profile_postal_code?: string | null;
};

const clean = (value?: string | null) => String(value || '').trim();

const joinLocationParts = (parts: Array<string | null | undefined>) =>
  parts.map(clean).filter(Boolean).join(', ');

export const getEventLocationDisplay = (event: EventLocationish = {}) => {
  const eventAddress = clean(event.address);
  if (eventAddress) return eventAddress;

  const venueAddress = joinLocationParts([
    event.venue_profile_address,
    event.venue_profile_city,
    event.venue_profile_state,
    event.venue_profile_postal_code,
  ]);
  if (venueAddress) return venueAddress;

  const location = clean(event.location);
  if (location) return location;

  return joinLocationParts([
    event.venue_profile_display_name || event.venue_name,
    event.venue_profile_city,
    event.venue_profile_state,
  ]);
};

export const getEventMapAddress = (event: EventLocationish = {}) => {
  const eventAddress = clean(event.address);
  const venueName = clean(event.venue_profile_display_name || event.venue_name);
  if (eventAddress) return joinLocationParts([venueName, eventAddress]);

  const venueAddress = joinLocationParts([
    event.venue_profile_address,
    event.venue_profile_city,
    event.venue_profile_state,
    event.venue_profile_postal_code,
  ]);
  if (venueAddress) return joinLocationParts([venueName, venueAddress]);

  const location = clean(event.location);
  if (location) return joinLocationParts([venueName, location]);

  return joinLocationParts([venueName, event.venue_profile_city, event.venue_profile_state]);
};

export const getGoogleMapsUrl = (eventOrAddress?: EventLocationish | string | null) => {
  const query = typeof eventOrAddress === 'string'
    ? clean(eventOrAddress)
    : getEventMapAddress(eventOrAddress || {});

  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
