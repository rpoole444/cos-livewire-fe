import dayjs from 'dayjs';
import { buildEventDateTime, parseLocalDayjs } from '@/util/dateHelper';
import { getRegionLabel } from '@/constants/regions';

type ProfileType = 'artist' | 'venue' | 'promoter';

export type ProfileValueArtist = {
  display_name: string;
  slug: string;
  bio?: string | null;
  contact_email?: string | null;
  booking_email?: string | null;
  website?: string | null;
  tip_jar_url?: string | null;
  genres?: string[] | null;
  home_region?: string | null;
  profile_image?: string | null;
  promo_photo?: string | null;
  stage_plot?: string | null;
  press_kit?: string | null;
  embed_youtube?: string | null;
  embed_soundcloud?: string | null;
  embed_bandcamp?: string | null;
  profile_type?: ProfileType;
  venue_city?: string | null;
  venue_state?: string | null;
  venue_capacity?: number | null;
  age_policy?: string | null;
  venue_stage_size?: string | null;
  venue_pa_details?: string | null;
  venue_backline?: string | null;
  venue_load_in?: string | null;
  venue_parking?: string | null;
  venue_green_room?: string | null;
  venue_sound_contact?: string | null;
  venue_booking_policy?: string | null;
  events?: ProfileValueEvent[];
};

export type ProfileValueEvent = {
  id: number;
  title: string;
  date: string;
  start_time?: string | null;
  venue_name?: string | null;
  location?: string | null;
  genre?: string | null;
  slug?: string | null;
  website_link?: string | null;
};

export const normalizeExternalUrl = (value?: string | null) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const formatEventDateLine = (event: ProfileValueEvent) => {
  const date = event.date ? parseLocalDayjs(event.date) : null;
  const startDateTime = buildEventDateTime(event.date, event.start_time || undefined);
  const time = startDateTime ? dayjs(startDateTime) : null;
  const dateLabel = date?.isValid() ? date.format('ddd, MMM D') : 'Date TBA';
  const timeLabel = time?.isValid() ? time.format('h:mm A') : null;
  return timeLabel ? `${dateLabel} at ${timeLabel}` : dateLabel;
};

export const getProfileCompleteness = (artist: ProfileValueArtist) => {
  const checks = [
    { label: 'bio', complete: Boolean(artist.bio && artist.bio.trim().length >= 80), prompt: 'Add a stronger bio.' },
    { label: 'genres', complete: Boolean(artist.genres?.length), prompt: 'Add genres or styles.' },
    { label: 'home region', complete: Boolean(artist.home_region), prompt: 'Set a home region.' },
    { label: 'profile image', complete: Boolean(artist.profile_image), prompt: 'Add a profile image.' },
    { label: 'booking email', complete: Boolean(artist.booking_email || artist.contact_email), prompt: 'Add a booking email.' },
    { label: 'website', complete: Boolean(artist.website), prompt: 'Add an official website.' },
    { label: 'tip jar', complete: Boolean(artist.tip_jar_url), prompt: 'Add a tip jar or support link.' },
    { label: 'video', complete: Boolean(artist.embed_youtube), prompt: 'Add a latest video.' },
    { label: 'promo photo', complete: Boolean(artist.promo_photo), prompt: 'Upload a promo photo.' },
    { label: 'stage plot', complete: Boolean(artist.stage_plot), prompt: 'Upload a stage plot or tech specs.' },
    { label: 'press kit', complete: Boolean(artist.press_kit), prompt: 'Upload a press kit.' },
    { label: 'upcoming shows', complete: Boolean(artist.events?.length), prompt: 'Add or submit upcoming dates.' },
    ...(artist.profile_type === 'venue'
      ? [
          { label: 'capacity', complete: Boolean(artist.venue_capacity), prompt: 'Add venue capacity.' },
          { label: 'PA details', complete: Boolean(artist.venue_pa_details), prompt: 'Add PA / sound details.' },
          { label: 'load-in', complete: Boolean(artist.venue_load_in), prompt: 'Add load-in instructions.' },
          { label: 'booking policy', complete: Boolean(artist.venue_booking_policy), prompt: 'Add a booking policy.' },
        ]
      : []),
  ];
  const completed = checks.filter((check) => check.complete).length;
  return {
    percent: Math.round((completed / checks.length) * 100),
    missing: checks.filter((check) => !check.complete).map((check) => check.prompt),
  };
};

export const buildBookingSnapshotText = (artist: ProfileValueArtist, profileUrl: string) => {
  const bookingEmail = artist.booking_email || artist.contact_email || 'Not provided';
  const region = artist.home_region ? getRegionLabel(artist.home_region) : 'Not set';
  const styles = artist.genres?.length ? artist.genres.join(', ') : 'Not listed';
  const dates = artist.events?.length
    ? artist.events.slice(0, 5).map((event) => `- ${formatEventDateLine(event)} - ${event.title} @ ${event.venue_name || 'Venue TBA'}`).join('\n')
    : '- No upcoming dates listed';

  return [
    `${artist.display_name} - Booking Snapshot`,
    '',
    `Profile: ${profileUrl}`,
    `Type: ${artist.profile_type || 'artist'}`,
    `Genre / style: ${styles}`,
    `Home region: ${region}`,
    `Hometown / location: ${[artist.venue_city, artist.venue_state].filter(Boolean).join(', ') || region}`,
    `Booking email: ${bookingEmail}`,
    `Website: ${normalizeExternalUrl(artist.website) || 'Not provided'}`,
    `Tip jar: ${normalizeExternalUrl(artist.tip_jar_url) || 'Not provided'}`,
    `Latest video: ${artist.embed_youtube || 'Not provided'}`,
    `Promo photo: ${artist.promo_photo || 'Not provided'}`,
    `Stage plot / tech specs: ${artist.stage_plot || 'Not provided'}`,
    `Press kit: ${artist.press_kit || 'Not provided'}`,
    '',
    'Upcoming dates:',
    dates,
  ].join('\n');
};

export const buildLuxuryBookingPacketOutline = (artist: ProfileValueArtist, profileUrl: string) => {
  const bookingEmail = artist.booking_email || artist.contact_email || 'Not provided';
  const styles = artist.genres?.length ? artist.genres.join(', ') : 'Not listed';
  const region = artist.home_region ? getRegionLabel(artist.home_region) : 'Not set';

  return [
    `${artist.display_name} - Luxury Booking Packet Outline`,
    '',
    'Use this as a client-ready packet structure for weddings, private events, venues, festivals, and corporate bookings.',
    '',
    'Cover Page',
    `Artist / ensemble: ${artist.display_name}`,
    `Styles: ${styles}`,
    `Home region: ${region}`,
    `Booking email: ${bookingEmail}`,
    `Profile: ${profileUrl}`,
    '',
    'Welcome Letter',
    'Thank the client, confirm the tone of the event, and explain that the packet keeps agreement terms, music planning, and logistics in one place.',
    '',
    'Performance Agreement Fields',
    '- Client name',
    '- Event date',
    '- Venue and address',
    '- Performance time',
    '- Ensemble size',
    '- Total fee',
    '- Deposit amount',
    '- Remaining balance',
    '- Sound system / production notes',
    '- Special notes',
    '',
    'Core Terms',
    '- Deposit reserves the date',
    '- Remaining balance due before first performance unless otherwise agreed',
    '- Safe performance area and power required',
    '- Weather protection required for outdoor events',
    '- Custom arrangements available with advance notice',
    '- Overtime billed only if available and approved',
    '- Cancellation and emergency terms clearly stated',
    '',
    'Wedding Music Planning Questionnaire',
    '- Ceremony music',
    '- Cocktail hour music',
    '- Grand entrance',
    '- First dance',
    '- Parent dances',
    '- Cake cutting',
    '- Last dance',
    '- Must-play songs',
    '- Do-not-play songs',
    '- Special dedications or announcements',
    '- Timeline and special moments',
    '',
    'Venue Logistics',
    '- Load-in instructions',
    '- Parking',
    '- Power location',
    '- Rain / weather plan',
    '- Accessibility notes',
    '- Planner or venue contact',
    '',
    'Luxury Packet Extras',
    '- Sample set lists',
    '- Song request guide',
    '- FAQ',
    '- Final checklist',
    '- Signature page',
  ].join('\n');
};

export const buildPromoCopy = (event: ProfileValueEvent, artistName: string) => {
  const dateLine = formatEventDateLine(event);
  const venueLine = [event.venue_name, event.location].filter(Boolean).join(' in ');
  const ticketUrl = normalizeExternalUrl(event.website_link);

  return {
    instagram: `${artistName} is playing ${event.title} ${dateLine}${venueLine ? ` at ${venueLine}` : ''}. Save the date and check Alpine Groove Guide for details.${ticketUrl ? ` Tickets/info: ${ticketUrl}` : ''}`,
    facebook: `Join ${artistName} for ${event.title} on ${dateLine}${venueLine ? ` at ${venueLine}` : ''}. Find details, tickets, and more upcoming Front Range shows on Alpine Groove Guide.${ticketUrl ? `\n\nTickets/info: ${ticketUrl}` : ''}`,
    sms: `${artistName}: ${event.title} ${dateLine}${event.venue_name ? ` @ ${event.venue_name}` : ''}${ticketUrl ? `. Info: ${ticketUrl}` : ''}`,
  };
};
