// pages/artists/[slug].tsx
import { GetServerSideProps } from 'next';
import { type FormEvent, useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import TrialBanner from '@/components/TrialBanner';
import { FaFacebookF, FaTwitter, FaLink, FaShareAlt } from 'react-icons/fa';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import EventPoster from '@/components/EventPoster';
import ProfileImage from '@/components/ProfileImage';
import { buildEventDateTime, parseLocalDayjs } from '@/util/dateHelper';
import { COMMUNITY_ARTIST_ACCESS_LABEL, isCommunityArtistAccessActive } from '@/util/communityAccess';
import { Building2, ExternalLink, MapPin, Phone, Ticket, Users } from 'lucide-react';
import { getRegionLabel, isMusicRegionSlug } from '@/constants/regions';
import {
  buildBookingSnapshotText,
  buildLuxuryBookingPacketOutline,
  buildPromoCopy,
  formatEventDateLine,
  getProfileCompleteness,
  normalizeExternalUrl,
} from '@/util/profileValueTools';
dayjs.extend(utc);

interface Event {
  id: number;
  title: string;
  date: string;
  venue_name: string;
  venue_profile_id?: number | null;
  location: string;
  genre: string;
  slug: string;
  poster?: string | null;
  display_image_url?: string | null;
  display_image_source?: string | null;
  event_poster_status?: string | null;
  source?: string | null;
  source_label?: string | null;
  start_time?: string;
  website_link?: string | null;
  ticket_price?: string | null;
}

interface Artist {
  id: number;
  display_name: string;
  user_id?: number | null;
  bio: string;
  contact_email: string;
  profile_image: string;
  promo_photo?: string;
  stage_plot?: string;
  press_kit?: string;
  embed_youtube?: string;
  embed_soundcloud?: string;
  embed_bandcamp?: string;
  website?: string;
  is_pro?: boolean;
  genres: string[];
  slug: string;
  tip_jar_url: string;
  events: Event[];
  trial_ends_at?: string | null;
  is_approved?: boolean;
  access_state?: 'pro' | 'trial' | 'gated' | 'community' | 'shell' | 'none';
  is_shell?: boolean;
  is_admin_editor?: boolean;
  is_owner?: boolean;
  pro_cancelled_at?: string | null;
  profile_type?: 'artist' | 'venue' | 'promoter';
  home_region?: string;
  venue_address?: string;
  venue_city?: string;
  venue_state?: string;
  venue_postal_code?: string;
  venue_phone?: string;
  booking_email?: string;
  venue_capacity?: number | null;
  age_policy?: string;
  venue_stage_size?: string | null;
  venue_pa_details?: string | null;
  venue_backline?: string | null;
  venue_load_in?: string | null;
  venue_parking?: string | null;
  venue_green_room?: string | null;
  venue_sound_contact?: string | null;
  venue_booking_policy?: string | null;
  past_events?: Event[];
}

type WidgetOptions = {
  theme: 'dark' | 'light';
  layout: 'full' | 'compact';
  embedMode: 'upcoming' | 'top-picks';
  titleOverride: string;
  showPoster: boolean;
  showTicketButton: boolean;
  limit: number;
};

type TopPickEvent = Event & {
  is_top_pick?: boolean;
  featured_order?: number | null;
};

type AnalyticsCounts = Record<string, number>;

interface Props {
  artist: Artist | null;
}

type MediaProvider = 'soundcloud' | 'bandcamp';

const ResponsiveMediaEmbed = ({
  src,
  provider,
  title,
}: {
  src: string;
  provider: MediaProvider;
  title: string;
}) => {
  const baseWrapper =
    'w-full max-w-4xl mx-auto mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40';
  const heightClasses =
    provider === 'soundcloud'
      ? 'h-[300px] sm:h-[360px] lg:h-[420px]'
      : 'h-[200px] sm:h-[230px] lg:h-[260px]'; // Let Bandcamp embed card height match player

  return (
    <div className={baseWrapper}>
      {/* Ensure embeds feel intentional across screen sizes by fixing sensible default heights per provider */}
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="autoplay"
        className={`w-full ${heightClasses}`}
        frameBorder="0"
        scrolling="no"
        allowFullScreen
      />
    </div>
  );
};

const ArtistProfilePage = ({ artist }: Props) => {
  const { user } = useAuth();
  const router = useRouter();
  const isPending = router.query.pending === 'true';
  const isOwner = artist?.is_owner ?? user?.id === artist?.user_id;
  const canEdit = artist && user && (user.id === artist.user_id || user.is_admin);
  const canManagePrivateTools = Boolean(artist && (artist.is_owner || user?.id === artist.user_id || user?.is_admin));
  const [showTrialToast, setShowTrialToast] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [bookingLinkCopied, setBookingLinkCopied] = useState(false);
  const [copiedPromoKey, setCopiedPromoKey] = useState<string | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryError, setInquiryError] = useState('');
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    date: '',
    eventName: '',
    budget: '',
    notes: '',
  });
  const [venueRequestOpen, setVenueRequestOpen] = useState(false);
  const [venueRequestSubmitting, setVenueRequestSubmitting] = useState(false);
  const [venueRequestMessage, setVenueRequestMessage] = useState('');
  const [venueRequestError, setVenueRequestError] = useState('');
  const [venueRequestForm, setVenueRequestForm] = useState({
    artistName: '',
    email: '',
    genre: '',
    drawEstimate: '',
    links: '',
    preferredDates: '',
    supportNeeds: '',
    notes: '',
  });
  const [widgetOptions, setWidgetOptions] = useState<WidgetOptions>({
    theme: 'dark',
    layout: 'full',
    embedMode: 'upcoming',
    titleOverride: 'Top Picks',
    showPoster: true,
    showTicketButton: true,
    limit: 5,
  });
  const [topPickEvents, setTopPickEvents] = useState<TopPickEvent[]>([]);
  const [selectedTopPickIds, setSelectedTopPickIds] = useState<number[]>([]);
  const [topPicksStatus, setTopPicksStatus] = useState('');
  const [topPicksError, setTopPicksError] = useState('');
  const [topPicksSaving, setTopPicksSaving] = useState(false);
  const [analyticsCounts, setAnalyticsCounts] = useState<AnalyticsCounts | null>(null);
  const accessState = artist?.access_state ?? 'none';
  const isShellProfile = Boolean(artist?.is_shell || accessState === 'shell');
  const communityAccessActive = isCommunityArtistAccessActive();
  const isProAccess = accessState === 'pro';
  const isTrialAccess = accessState === 'trial';
  const isGated = !communityAccessActive && !isOwner && accessState === 'gated';
  const shouldBlur = isGated;
  const showPendingBanner = isPending && isOwner && artist && artist.is_approved === false;
  const profileType = artist?.profile_type || 'artist';
  const isVenue = profileType === 'venue';
  const profileLabel = isVenue ? 'Venue' : profileType === 'promoter' ? 'Promoter' : 'Artist';
  const pageTitle = artist?.display_name
    ? `${artist.display_name} – ${profileLabel}`
    : `${profileLabel} Profile – Alpine Groove Guide`;
  const shellClaimHref = artist
    ? `/artist-signup?type=venue&displayName=${encodeURIComponent(artist.display_name)}&slug=${encodeURIComponent(artist.slug)}&source=shell-venue`
    : '/artist-signup?type=venue';

  const trackArtistEvent = async (
    eventType: string,
    options: { eventId?: number; source?: string; metadata?: Record<string, unknown> } = {}
  ) => {
    if (!artist?.slug) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${artist.slug}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          event_id: options.eventId,
          source: options.source || 'profile',
          metadata: options.metadata,
        }),
      });
    } catch (error) {
      console.warn('[artist analytics] tracking failed', error);
    }
  };

  useEffect(() => {
    if (!artist?.slug || isOwner) return;
    trackArtistEvent('profile_view');
  }, [artist?.slug, isOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!artist?.slug || !canManagePrivateTools) return;
    const loadAnalytics = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${artist.slug}/analytics`, {
          credentials: 'include',
        });
        if (!response.ok) return;
        const data = await response.json().catch(() => null);
        setAnalyticsCounts(data?.counts || null);
      } catch (error) {
        console.warn('[artist analytics] summary failed', error);
      }
    };
    loadAnalytics();
  }, [artist?.slug, canManagePrivateTools]);

  useEffect(() => {
    if (!artist?.slug || !canManagePrivateTools) return;

    const loadTopPicks = async () => {
      setTopPicksError('');
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${artist.slug}/top-picks`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Unable to load Top Picks.');
        }
        const data = await response.json();
        const events = Array.isArray(data?.events) ? data.events : [];
        setTopPickEvents(events);
        setSelectedTopPickIds(
          events
            .filter((event: TopPickEvent) => event.is_top_pick)
            .map((event: TopPickEvent) => Number(event.id))
        );
      } catch (error) {
        console.warn('[top picks] load failed', error);
        setTopPicksError(error instanceof Error ? error.message : 'Unable to load Top Picks.');
      }
    };

    loadTopPicks();
  }, [artist?.slug, canManagePrivateTools]);

  useEffect(() => {
    if (router.query.trial === 'active') {
      setShowTrialToast(true);
      setTimeout(() => setShowTrialToast(false), 5000);
    }
  }, [router.query]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this Pro page?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${artist?.slug}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        alert(`${profileLabel} profile deleted successfully.`);
        router.push('/');
      } else {
        const errData = await res.json();
        alert(`Failed to delete profile: ${errData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting.');
    } finally {
      setDeleting(false);
    }
  };

  const copyText = async (text: string, key?: string) => {
    await navigator.clipboard.writeText(text);
    if (key) {
      setCopiedPromoKey(key);
      window.setTimeout(() => setCopiedPromoKey(null), 2200);
    }
  };

  const toggleTopPick = (eventId: number, checked: boolean) => {
    setSelectedTopPickIds((prev) => {
      if (checked) return prev.includes(eventId) ? prev : [...prev, eventId];
      return prev.filter((id) => id !== eventId);
    });
    setTopPicksStatus('');
  };

  const saveTopPicks = async () => {
    if (!artist?.slug) return;
    setTopPicksSaving(true);
    setTopPicksError('');
    setTopPicksStatus('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${artist.slug}/top-picks`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_ids: selectedTopPickIds }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to save Top Picks.');
      }
      const events = Array.isArray(data?.events) ? data.events : [];
      setTopPickEvents(events);
      setSelectedTopPickIds(
        events
          .filter((event: TopPickEvent) => event.is_top_pick)
          .map((event: TopPickEvent) => Number(event.id))
      );
      setTopPicksStatus('Top Picks saved.');
    } catch (error) {
      setTopPicksError(error instanceof Error ? error.message : 'Unable to save Top Picks.');
    } finally {
      setTopPicksSaving(false);
    }
  };

  const downloadEpk = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleInquirySubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!artist) return;
    setInquirySubmitting(true);
    setInquiryError('');
    setInquiryMessage('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${artist.slug}/inquiry`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to send inquiry.');
      }
      setInquiryMessage('Inquiry sent. The profile owner will receive it by email.');
      setInquiryForm({ name: '', email: '', date: '', eventName: '', budget: '', notes: '' });
    } catch (error) {
      setInquiryError(error instanceof Error ? error.message : 'Unable to send inquiry.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  const handleVenueRequestSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!artist) return;
    setVenueRequestSubmitting(true);
    setVenueRequestError('');
    setVenueRequestMessage('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${artist.slug}/venue-booking-request`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venueRequestForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Unable to send booking request.');
      }
      setVenueRequestMessage('Booking request sent to the venue.');
      setVenueRequestForm({
        artistName: '',
        email: '',
        genre: '',
        drawEstimate: '',
        links: '',
        preferredDates: '',
        supportNeeds: '',
        notes: '',
      });
    } catch (error) {
      setVenueRequestError(error instanceof Error ? error.message : 'Unable to send booking request.');
    } finally {
      setVenueRequestSubmitting(false);
    }
  };

  if (!artist) {
    return (
      <>
        <Head>
          <title>{pageTitle}</title>
        </Head>
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16 text-slate-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-2xl shadow-black/40">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400">Pro Page</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Profile not found</h1>
            <p className="mt-3 text-sm text-slate-400">
              This Pro page isn&apos;t available. Browse the directory to discover Alpine Groove Guide artists, venues, and promoters.
            </p>
            <Link
              href="/artists"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0"
            >
              View artist directory
            </Link>
          </div>
        </div>
      </>
    );
  }

  const siteBaseUrl = 'https://app.alpinegrooveguide.com';
  const defaultSocialImage = `${siteBaseUrl}/alpine-groove-social-cover.png`;
  const shareUrl = `${siteBaseUrl}/share/artist/${artist.slug}`;
  const artistUrl = `${siteBaseUrl}/artists/${artist.slug}`;
  const embedParams = new URLSearchParams({
    theme: widgetOptions.theme,
    layout: widgetOptions.layout,
    mode: widgetOptions.embedMode,
    poster: widgetOptions.showPoster ? '1' : '0',
    tickets: widgetOptions.showTicketButton ? '1' : '0',
    limit: String(widgetOptions.limit),
  });
  if (widgetOptions.embedMode === 'top-picks' && widgetOptions.titleOverride.trim()) {
    embedParams.set('title', widgetOptions.titleOverride.trim());
  }
  const embedUrl = `${siteBaseUrl}/embed/artists/${artist.slug}?${embedParams.toString()}`;
  const embedHeight = widgetOptions.layout === 'compact' ? 360 : 620;
  const embedTitle = widgetOptions.embedMode === 'top-picks'
    ? `${artist.display_name} top picks`
    : `${artist.display_name} upcoming shows`;
  const embedSnippet = `<iframe src="${embedUrl}" title="${embedTitle.replace(/"/g, '&quot;')}" width="100%" height="${embedHeight}" style="border:0;border-radius:16px;overflow:hidden" loading="lazy"></iframe>`;
  const description = artist.bio
    ? artist.bio.length > 150
      ? `${artist.bio.slice(0, 147).trim()}…`
      : artist.bio
    : isVenue
    ? `${artist.display_name} is a Front Range live music venue featured on Alpine Groove Guide.`
    : `${artist.display_name} is featured on Alpine Groove Guide. Discover their upcoming shows.`;
  const ogImage = defaultSocialImage;
  const limitedHeadline = isOwner
    ? 'Your public profile is locked until you reactivate Alpine Pro.'
    : 'This profile is locked.';
  const limitedBody = isOwner
    ? 'Fans currently see a blurred preview because your Pro membership or trial ended. Reactivate Alpine Pro to unlock your media, downloads, and events.'
    : `Become an Alpine Pro member to unlock the full bio, media, downloads, and events for this ${profileType}.`;
  const venueLocation = [artist.venue_city, artist.venue_state].filter(Boolean).join(', ');
  const venueFullAddress = [
    artist.venue_address,
    artist.venue_city,
    artist.venue_state,
    artist.venue_postal_code,
  ].filter(Boolean).join(', ');
  const bookingEmail = artist.booking_email || artist.contact_email;
  const completeness = getProfileCompleteness(artist);
  const epkText = buildBookingSnapshotText(artist, artistUrl);
  const bookingPacketOutlineText = buildLuxuryBookingPacketOutline(artist, artistUrl);
  const bookingAnchorUrl = `${artistUrl}#booking-inquiry`;
  const latestVideoLabel = artist.embed_youtube ? 'Video ready' : 'Add a YouTube video';
  const analyticsTotal = analyticsCounts
    ? Object.values(analyticsCounts).reduce((sum, value) => sum + Number(value || 0), 0)
    : 0;
  const hasVenuePublicRoomDetails = Boolean(
    artist.venue_stage_size ||
    artist.venue_pa_details ||
    artist.venue_backline ||
    artist.venue_sound_contact
  );
  const hasVenuePlayDetails = Boolean(
    artist.venue_load_in ||
    artist.venue_parking ||
    artist.venue_green_room ||
    artist.venue_booking_policy
  );
  const canViewPlayThisRoom = Boolean(user || canManagePrivateTools);
  const profileActionPlan = [
    {
      title: completeness.percent >= 85 ? 'Profile foundation looks strong' : 'Finish the booking basics',
      body: completeness.missing.length
        ? completeness.missing.slice(0, 2).join(' ')
        : 'Core booking fields, media, and profile basics are in place.',
      href: `/artists/edit/${artist.slug}`,
      action: completeness.percent >= 85 ? 'Review profile' : 'Improve profile',
      tone: completeness.percent >= 85 ? 'emerald' : 'amber',
    },
    {
      title: artist.events?.length ? `${artist.events.length} upcoming ${artist.events.length === 1 ? 'show' : 'shows'} connected` : 'Add upcoming shows',
      body: artist.events?.length
        ? 'Keep dates, ticket links, and posters current so fans and embeds stay accurate.'
        : 'Submit or bulk-add upcoming shows so this page has a useful schedule.',
      href: artist.events?.length ? `/embed/artists/${artist.slug}` : '/eventSubmission',
      action: artist.events?.length ? 'Preview embed' : 'Submit event',
      tone: artist.events?.length ? 'emerald' : 'amber',
    },
    {
      title: isVenue ? 'Venue booking workflow' : 'Booking snapshot',
      body: isVenue
        ? 'Artists can request dates from this venue page. Add booking policy and room details to make those requests better.'
        : 'Copy your booking link or download the EPK snapshot when pitching venues and private clients.',
      href: isVenue ? `/artists/edit/${artist.slug}` : `${artistUrl}#booking-snapshot`,
      action: isVenue ? 'Edit venue details' : 'Open booking tools',
      tone: 'cyan',
    },
    {
      title: analyticsTotal ? `${analyticsTotal} tracked interactions` : 'Analytics will start simple',
      body: analyticsTotal
        ? 'Use clicks and views to see which profile assets are getting attention.'
        : 'As people view your profile, clicks and views will show here for owner/admin accounts.',
      href: `/artists/${artist.slug}`,
      action: 'View analytics',
      tone: 'slate',
    },
  ];

  if (isShellProfile) {
    const shellLocation = venueFullAddress || venueLocation || getRegionLabel(artist.home_region);
    const shellDescription = artist.bio || `${artist.display_name} is an unclaimed venue listing on Alpine Groove Guide.`;
    const shellImage = artist.profile_image || defaultSocialImage;

    return (
      <>
        <Head>
          <title>{artist.display_name} – Unclaimed Venue</title>
          <meta name="description" content={shellDescription} />
          <meta property="og:site_name" content="Alpine Groove Guide" />
          <meta property="og:title" content={`${artist.display_name} – Unclaimed Venue`} />
          <meta property="og:description" content={shellDescription} />
          <meta property="og:type" content="profile" />
          <meta property="og:url" content={artistUrl} />
          <meta property="og:image" content={shellImage} />
          <meta property="og:image:secure_url" content={shellImage} />
          <meta property="og:image:alt" content={`${artist.display_name} on Alpine Groove Guide`} />
          <link rel="canonical" href={artistUrl} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${artist.display_name} – Unclaimed Venue`} />
          <meta name="twitter:description" content={shellDescription} />
          <meta name="twitter:image" content={shellImage} />
        </Head>

        <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
          <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/75 shadow-2xl shadow-black/30">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
              <div className="relative min-h-[320px] bg-gradient-to-br from-slate-950 via-slate-900 to-black sm:min-h-[420px] lg:min-h-full">
                <ProfileImage
                  src={artist.profile_image}
                  alt={artist.display_name}
                  fill
                  fallbackSubLabel="Venue"
                  className="object-contain p-6 sm:p-8"
                  sizes="(min-width: 1024px) 58vw, 100vw"
                />
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
                    Unclaimed venue
                  </span>
                  {artist.home_region && (
                    <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-100">
                      {getRegionLabel(artist.home_region)}
                    </span>
                  )}
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {artist.display_name}
                </h1>
                <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                  {shellDescription}
                </p>

                <div className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                  {shellLocation && (
                    <p className="flex gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                      <span>{shellLocation}</span>
                    </p>
                  )}
                  {artist.venue_phone && (
                    <p className="flex gap-2">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                      <span>{artist.venue_phone}</span>
                    </p>
                  )}
                  {artist.website && (
                    <p className="flex gap-2">
                      <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                      <a
                        href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-200 underline-offset-4 hover:underline"
                      >
                        Venue website
                      </a>
                    </p>
                  )}
                </div>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">
                  This is a lightweight venue listing created from community calendar data. Full venue tools, booking
                  details, embeds, and enhanced profile features unlock after the venue is claimed and completed.
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">Manage this venue?</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Claim this venue page</h2>
                  <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                    Keep the existing listing, then add venue photos, booking details, calendar embeds, room info,
                    and faster event submission tools from your account.
                  </p>
                  <Link
                    href={shellClaimHref}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300 sm:w-auto"
                  >
                    Claim / complete venue page
                  </Link>
                  <p className="mt-3 text-xs leading-5 text-emerald-50/60">
                    You&apos;ll need a free account, a venue image, and basic address details to submit the claim.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {user?.is_admin && (
                    <Link
                      href={`/artists/edit/${artist.slug}`}
                      className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-300"
                    >
                      Admin edit shell venue
                    </Link>
                  )}
                  <Link
                    href={`/venues/${artist.home_region || 'colorado-springs'}`}
                    className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/60 hover:text-white"
                  >
                    Browse venues
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta property="og:site_name" content="Alpine Groove Guide" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={artistUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="628" />
        <meta property="og:image:alt" content={`${artist.display_name} on Alpine Groove Guide`} />
        <link rel="canonical" href={artistUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      <div className="relative min-h-screen overflow-hidden bg-[#050806] px-4 py-8 text-slate-50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(224,184,97,0.18),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(79,120,112,0.18),transparent_32%),linear-gradient(180deg,rgba(11,12,9,0),rgba(11,12,9,0.75))]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[80vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8">
          {showPendingBanner && (
            <div className="rounded bg-yellow-400 p-3 text-center text-sm font-medium text-black shadow">
              ⏳ Your Pro page is currently <strong>pending admin approval</strong>. You’ll be notified when approved.
            </div>
          )}
          {showTrialToast && isOwner && (
            <div className="rounded bg-green-600 p-2 text-center text-sm text-white shadow">✅ Your Alpine Pro trial is active.</div>
          )}
          {communityAccessActive && (
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-center text-sm text-emerald-100 shadow">
              {COMMUNITY_ARTIST_ACCESS_LABEL}. This profile is available while community access is open.
            </div>
          )}
          {isGated && (
            <div className="rounded bg-slate-800 p-3 text-center text-sm text-blue-300 shadow">
              📣 This profile is locked because the Alpine Pro membership isn’t active.{' '}
              <Link href="/upgrade" className="underline hover:text-blue-200">
                Learn more about Alpine Pro
              </Link>
              .
            </div>
          )}

          <TrialBanner artist_user_id={artist.user_id || undefined} trial_ends_at={artist.trial_ends_at} is_pro={isProAccess} />

          <section className="agg-corner-frame relative overflow-hidden border border-gold/40 bg-gradient-to-br from-[#192018] via-black to-[#0b0c09] p-5 shadow-2xl shadow-black/50 sm:p-7">
            <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-12 h-72 w-72 rounded-full bg-alpine/10 blur-3xl" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
              <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:items-start">
                <div className="mx-auto flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl shadow-black/50 ring-1 ring-gold/30 sm:mx-0 lg:h-56 lg:w-56">
                  <ProfileImage
                    src={artist.profile_image}
                    alt={artist.display_name}
                    width={224}
                    height={224}
                    fallbackSubLabel={isVenue ? 'Venue' : artist.profile_type === 'promoter' ? 'Promoter' : 'Artist'}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="agg-display text-4xl font-semibold leading-[0.95] text-sun-gold drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] sm:text-5xl lg:text-6xl">{artist.display_name}</h1>
                    <span className="inline-flex items-center gap-1.5 border border-alpine/60 bg-pine/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-mist">
                      {isVenue && <Building2 className="h-3.5 w-3.5" />}
                      {profileLabel}
                    </span>
                    {artist.home_region && (
                      <span className="inline-flex items-center gap-1.5 border border-gold/50 bg-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sun-gold">
                        {getRegionLabel(artist.home_region)}
                      </span>
                    )}
                    {isProAccess && (
                      <span className="rounded-full border border-emerald-400/70 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                        Alpine Pro
                      </span>
                    )}
                    {isTrialAccess && (
                      <span className="rounded-full border border-blue-400/70 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-100">
                        Trial
                      </span>
                    )}
                    {isGated && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
                        🔒 Profile locked
                      </span>
                    )}
                  </div>
                  {isVenue && venueLocation && (
                    <p className="flex items-center gap-2 text-sm font-semibold text-alpine">
                      <MapPin className="h-4 w-4" />
                      {venueLocation}
                    </p>
                  )}
                  {artist.bio ? (
                    <p className="max-w-3xl text-base leading-8 text-ivory/78">{artist.bio}</p>
                  ) : (
                    <p className="max-w-3xl text-base leading-8 text-ivory/55">This {profileType} hasn&apos;t added a bio yet.</p>
                  )}
                  {artist.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {artist.genres.map((genre) => (
                        <span key={genre} className="rounded-full border border-alpine/35 bg-alpine/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-mist">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full rounded-[1.5rem] border border-gold/25 bg-black/45 p-5 shadow-xl shadow-black/30 lg:max-w-sm">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  {isVenue ? 'Booking / Venue Contact' : 'Contact / Book'}
                </h3>
                <div className="mt-3 space-y-3">
                  {bookingEmail &&
                    (shouldBlur ? (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-slate-300 opacity-60">
                        Contact / Book
                      </div>
                    ) : (
                      <button
                        id="booking-inquiry"
                        type="button"
                        onClick={() => {
                          setInquiryOpen((open) => !open);
                          trackArtistEvent('contact_click');
                        }}
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-emerald-400/60 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/20"
                      >
                        {isVenue ? 'Send venue inquiry' : 'Send booking inquiry'}
                      </button>
                    ))}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <a
                      href={normalizeExternalUrl(artist.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackArtistEvent('website_click')}
                      className={`rounded-2xl border border-slate-700 px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white ${
                        shouldBlur || !artist.website ? 'pointer-events-none opacity-60 blur-[1px]' : ''
                      }`}
                    >
                      Official Website <ExternalLink className="ml-1 inline h-3.5 w-3.5" />
                    </a>
                    <a
                      href={normalizeExternalUrl(artist.tip_jar_url) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackArtistEvent('tip_click')}
                      className={`rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-center text-sm font-semibold text-amber-200 transition hover:border-amber-300 hover:bg-amber-500/20 ${
                        shouldBlur || !artist.tip_jar_url ? 'pointer-events-none opacity-60 blur-[1px]' : ''
                      }`}
                    >
                      {isVenue ? 'Support this venue' : 'Send a Tip 💐'}
                    </a>
                  </div>

                  {inquiryOpen && !shouldBlur && (
                    <form onSubmit={handleInquirySubmit} className="space-y-3 rounded-2xl border border-slate-800 bg-black/30 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          value={inquiryForm.name}
                          onChange={(event) => setInquiryForm((prev) => ({ ...prev, name: event.target.value }))}
                          required
                          placeholder="Your name"
                          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                        />
                        <input
                          value={inquiryForm.email}
                          onChange={(event) => setInquiryForm((prev) => ({ ...prev, email: event.target.value }))}
                          required
                          type="email"
                          placeholder="Your email"
                          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                        />
                        <input
                          value={inquiryForm.date}
                          onChange={(event) => setInquiryForm((prev) => ({ ...prev, date: event.target.value }))}
                          type="date"
                          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                        />
                        <input
                          value={inquiryForm.budget}
                          onChange={(event) => setInquiryForm((prev) => ({ ...prev, budget: event.target.value }))}
                          placeholder="Budget range"
                          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                        />
                      </div>
                      <input
                        value={inquiryForm.eventName}
                        onChange={(event) => setInquiryForm((prev) => ({ ...prev, eventName: event.target.value }))}
                        placeholder="Venue / event"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                      />
                      <textarea
                        value={inquiryForm.notes}
                        onChange={(event) => setInquiryForm((prev) => ({ ...prev, notes: event.target.value }))}
                        placeholder="Notes, set length, backline needs, expected audience, or anything helpful"
                        rows={4}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                      />
                      {inquiryError && <p className="text-xs text-red-300">{inquiryError}</p>}
                      {inquiryMessage && <p className="text-xs text-emerald-300">{inquiryMessage}</p>}
                      <button
                        type="submit"
                        disabled={inquirySubmitting}
                        className="w-full rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {inquirySubmitting ? 'Sending inquiry...' : 'Send inquiry'}
                      </button>
                    </form>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: artist.display_name,
                            url: shareUrl,
                          });
                        }
                      }}
                      className="flex flex-1 min-w-[120px] items-center justify-center gap-1 rounded-full border border-yellow-400/40 px-3 py-1 text-xs font-semibold text-yellow-200 transition hover:border-yellow-300 hover:text-white"
                    >
                      <FaShareAlt /> Share
                    </button>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 min-w-[120px] items-center justify-center gap-1 rounded-full border border-blue-500/40 px-3 py-1 text-xs font-semibold text-blue-200 transition hover:border-blue-400 hover:text-white"
                    >
                      <FaFacebookF /> Facebook
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(artist.display_name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 min-w-[120px] items-center justify-center gap-1 rounded-full border border-sky-500/40 px-3 py-1 text-xs font-semibold text-sky-200 transition hover:border-sky-400 hover:text-white"
                    >
                      <FaTwitter /> X
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        alert('Link copied to clipboard!');
                      }}
                      className="flex flex-1 min-w-[120px] items-center justify-center gap-1 rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-white hover:text-white"
                    >
                      <FaLink /> Copy
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            </section>

          <section id="booking-snapshot" className="agg-corner-frame border border-gold/30 bg-gradient-to-br from-[#11170f] via-black to-[#0b0f13] p-6 shadow-2xl shadow-black/40">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-alpine">Smart EPK</p>
                <h2 className="agg-display mt-2 text-3xl font-semibold text-sun-gold">Booking Snapshot</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ivory/65">
                  A clean, booker-friendly snapshot with the details venues, presenters, and media usually need first.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={async () => {
                    if (shouldBlur) return;
                    await navigator.clipboard.writeText(bookingAnchorUrl);
                    setBookingLinkCopied(true);
                    window.setTimeout(() => setBookingLinkCopied(false), 2200);
                  }}
                  disabled={shouldBlur}
                  className="rounded-xl border border-alpine/50 px-4 py-2.5 text-sm font-semibold text-mist transition hover:border-alpine hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bookingLinkCopied ? 'Booking link copied' : 'Copy booking link'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (shouldBlur) return;
                    downloadEpk(`${artist.slug}-booking-snapshot.txt`, epkText);
                  }}
                  disabled={shouldBlur}
                  className="rounded-xl bg-sun-gold px-4 py-2.5 text-sm font-black text-night transition hover:bg-mist disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Download EPK
                </button>
              </div>
            </div>

            {shouldBlur ? (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-300">
                Booking snapshot details unlock when this profile has active Alpine Pro access.
              </div>
            ) : (
              <>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-gold/25 bg-black/45 p-4 shadow-lg shadow-black/20">
                <p className="text-xs uppercase tracking-[0.2em] text-ivory/45">Genre / style</p>
                <p className="mt-2 font-semibold text-ivory">{artist.genres?.length ? artist.genres.join(', ') : 'Not listed'}</p>
              </div>
              <div className="rounded-2xl border border-gold/25 bg-black/45 p-4 shadow-lg shadow-black/20">
                <p className="text-xs uppercase tracking-[0.2em] text-ivory/45">Hometown / region</p>
                <p className="mt-2 font-semibold text-ivory">
                  {[artist.venue_city, artist.venue_state].filter(Boolean).join(', ') || (artist.home_region ? getRegionLabel(artist.home_region) : 'Not set')}
                </p>
              </div>
              <div className="rounded-2xl border border-gold/25 bg-black/45 p-4 shadow-lg shadow-black/20">
                <p className="text-xs uppercase tracking-[0.2em] text-ivory/45">Booking email</p>
                <p className="mt-2 break-words font-semibold text-ivory">{bookingEmail || 'Not provided'}</p>
              </div>
              <div className="rounded-2xl border border-gold/25 bg-black/45 p-4 shadow-lg shadow-black/20">
                <p className="text-xs uppercase tracking-[0.2em] text-ivory/45">Website</p>
                {artist.website ? (
                  <a
                    href={normalizeExternalUrl(artist.website)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackArtistEvent('website_click', { source: 'epk' })}
                    className="mt-2 block break-words font-semibold text-alpine underline"
                  >
                    {artist.website}
                  </a>
                ) : (
                  <p className="mt-2 font-semibold text-ivory">Not provided</p>
                )}
              </div>
              <div className="rounded-2xl border border-gold/25 bg-black/45 p-4 shadow-lg shadow-black/20">
                <p className="text-xs uppercase tracking-[0.2em] text-ivory/45">Tip jar</p>
                {artist.tip_jar_url ? (
                  <a
                    href={normalizeExternalUrl(artist.tip_jar_url)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackArtistEvent('tip_click', { source: 'epk' })}
                    className="mt-2 block break-words font-semibold text-alpine underline"
                  >
                    {artist.tip_jar_url}
                  </a>
                ) : (
                  <p className="mt-2 font-semibold text-ivory">Not provided</p>
                )}
              </div>
              <div className="rounded-2xl border border-gold/25 bg-black/45 p-4 shadow-lg shadow-black/20">
                <p className="text-xs uppercase tracking-[0.2em] text-ivory/45">Latest video</p>
                <p className="mt-2 font-semibold text-ivory">{latestVideoLabel}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {artist.promo_photo && (
                <a href={artist.promo_photo} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-emerald-200 hover:border-emerald-300">
                  Promo photo
                </a>
              )}
              {artist.stage_plot && (
                <a href={artist.stage_plot} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-emerald-200 hover:border-emerald-300">
                  Stage plot / tech specs
                </a>
              )}
              {artist.press_kit && (
                <a href={artist.press_kit} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-emerald-200 hover:border-emerald-300">
                  Press kit
                </a>
              )}
              <a href="#upcoming-dates" className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-emerald-200 hover:border-emerald-300">
                Upcoming dates
              </a>
            </div>

            <div className="mt-6 rounded-2xl border border-gold/30 bg-black/35 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-alpine">Booking packet</p>
                  <h3 className="mt-2 text-xl font-semibold text-sun-gold">Agreement and planning templates</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ivory/65">
                    Download a polished booking packet template with a performance agreement, wedding questionnaire,
                    song request guide, sample set lists, FAQ, and final checklist. Use the outline download as the
                    future form-builder map for this profile.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                  <a
                    href="/templates/reid-poole-music-booking-packet-template.pdf"
                    className="rounded-xl border border-sun-gold/60 px-4 py-2.5 text-center text-sm font-semibold text-sun-gold transition hover:bg-sun-gold hover:text-night"
                  >
                    Download PDF
                  </a>
                  <a
                    href="/templates/reid-poole-music-booking-packet-template.docx"
                    className="rounded-xl border border-alpine/60 px-4 py-2.5 text-center text-sm font-semibold text-mist transition hover:border-alpine hover:text-white"
                  >
                    Download DOCX
                  </a>
                  <button
                    type="button"
                    onClick={() => downloadEpk(`${artist.slug}-booking-packet-outline.txt`, bookingPacketOutlineText)}
                    className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300"
                  >
                    Download outline
                  </button>
                </div>
              </div>
            </div>
              </>
            )}
          </section>

          {isVenue && (
            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="agg-panel agg-corner-frame p-6">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-alpine">Plan your visit</p>
                  <h2 className="agg-display mt-2 text-2xl font-semibold text-sun-gold">Fan Details</h2>
                  <div className="mt-5 space-y-4 text-sm text-ivory/75">
                    {venueFullAddress && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueFullAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 transition hover:text-sun-gold"
                      >
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-copper" />
                        <span>
                          <strong className="block text-ivory">Address</strong>
                          {venueFullAddress}
                        </span>
                      </a>
                    )}
                    {artist.venue_phone && (
                      <a href={`tel:${artist.venue_phone}`} className="flex items-start gap-3 transition hover:text-sun-gold">
                        <Phone className="mt-0.5 h-5 w-5 shrink-0 text-alpine" />
                        <span>
                          <strong className="block text-ivory">Phone</strong>
                          {artist.venue_phone}
                        </span>
                      </a>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="border border-gold/25 bg-black/40 p-4">
                        <Users className="h-5 w-5 text-alpine" />
                        <p className="mt-2 text-xs uppercase tracking-wider text-ivory/45">Capacity</p>
                        <p className="mt-1 font-bold text-ivory">
                          {artist.venue_capacity ? artist.venue_capacity.toLocaleString() : 'Ask venue'}
                        </p>
                      </div>
                      <div className="border border-gold/25 bg-black/40 p-4">
                        <Ticket className="h-5 w-5 text-copper" />
                        <p className="mt-2 text-xs uppercase tracking-wider text-ivory/45">Age policy</p>
                        <p className="mt-1 font-bold text-ivory">{artist.age_policy || 'Varies by show'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="agg-panel agg-corner-frame p-6">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-alpine">Room / stage details</p>
                  <h2 className="agg-display mt-2 text-2xl font-semibold text-sun-gold">At a Glance</h2>
                  {hasVenuePublicRoomDetails ? (
                    <div className="mt-5 space-y-4 text-sm text-ivory/75">
                      {artist.venue_stage_size && (
                        <p><strong className="block text-ivory">Stage size</strong>{artist.venue_stage_size}</p>
                      )}
                      {artist.venue_pa_details && (
                        <p><strong className="block text-ivory">PA / sound</strong>{artist.venue_pa_details}</p>
                      )}
                      {artist.venue_backline && (
                        <p><strong className="block text-ivory">Backline</strong>{artist.venue_backline}</p>
                      )}
                      {artist.venue_sound_contact && (
                        <p><strong className="block text-ivory">Sound contact</strong>{artist.venue_sound_contact}</p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-ivory/55">This venue has not added stage or sound details yet.</p>
                  )}
                </div>
              </div>

              <div className="agg-panel agg-corner-frame p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-alpine">Play this room</p>
                    <h2 className="agg-display mt-2 text-2xl font-semibold text-sun-gold">Request to Play This Venue</h2>
                    <p className="mt-2 max-w-2xl text-sm text-ivory/60">
                      Artists can send a clean booking request with genre, draw, links, preferred dates, and support needs.
                      This is a premium-value venue workflow that is open during community access.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVenueRequestOpen((open) => !open)}
                    className="rounded-xl bg-sun-gold px-5 py-3 text-sm font-black text-night shadow-lg shadow-gold/20 transition hover:bg-mist"
                  >
                    {venueRequestOpen ? 'Close request form' : 'Request a date'}
                  </button>
                </div>

                {canViewPlayThisRoom ? (
                  hasVenuePlayDetails ? (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {artist.venue_load_in && (
                        <div className="border border-gold/25 bg-black/35 p-4 text-sm text-ivory/75">
                          <strong className="block text-ivory">Load-in</strong>{artist.venue_load_in}
                        </div>
                      )}
                      {artist.venue_parking && (
                        <div className="border border-gold/25 bg-black/35 p-4 text-sm text-ivory/75">
                          <strong className="block text-ivory">Artist parking</strong>{artist.venue_parking}
                        </div>
                      )}
                      {artist.venue_green_room && (
                        <div className="border border-gold/25 bg-black/35 p-4 text-sm text-ivory/75">
                          <strong className="block text-ivory">Green room / hospitality</strong>{artist.venue_green_room}
                        </div>
                      )}
                      {artist.venue_booking_policy && (
                        <div className="border border-gold/25 bg-black/35 p-4 text-sm text-ivory/75 md:col-span-2">
                          <strong className="block text-ivory">Booking policy</strong>{artist.venue_booking_policy}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-ivory/55">This venue has not added artist-facing room details yet.</p>
                  )
                ) : (
                  <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                    Log in or create an artist profile to view performer-facing load-in, backline, and booking details.
                  </div>
                )}

                {venueRequestOpen && (
                  <form onSubmit={handleVenueRequestSubmit} className="mt-5 space-y-3 rounded-2xl border border-slate-800 bg-black/30 p-4">
                    <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-50">
                      <strong className="block">Send one useful booking email.</strong>
                      Include your best links, realistic draw, preferred dates, and any support needs so the venue can answer quickly.
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input value={venueRequestForm.artistName} onChange={(event) => setVenueRequestForm((prev) => ({ ...prev, artistName: event.target.value }))} required placeholder="Artist / band name" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                      <input value={venueRequestForm.email} onChange={(event) => setVenueRequestForm((prev) => ({ ...prev, email: event.target.value }))} required type="email" placeholder="Contact email" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                      <input value={venueRequestForm.genre} onChange={(event) => setVenueRequestForm((prev) => ({ ...prev, genre: event.target.value }))} placeholder="Genre / style" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                      <input value={venueRequestForm.drawEstimate} onChange={(event) => setVenueRequestForm((prev) => ({ ...prev, drawEstimate: event.target.value }))} placeholder="Draw estimate" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                    </div>
                    <textarea value={venueRequestForm.links} onChange={(event) => setVenueRequestForm((prev) => ({ ...prev, links: event.target.value }))} placeholder="Music, website, EPK, or social links" rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                    <textarea value={venueRequestForm.preferredDates} onChange={(event) => setVenueRequestForm((prev) => ({ ...prev, preferredDates: event.target.value }))} placeholder="Preferred dates or date range" rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                    <textarea value={venueRequestForm.supportNeeds} onChange={(event) => setVenueRequestForm((prev) => ({ ...prev, supportNeeds: event.target.value }))} placeholder="Support needs, bill ideas, backline needs" rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                    <textarea value={venueRequestForm.notes} onChange={(event) => setVenueRequestForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Additional notes" rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                    {venueRequestError && <p className="text-xs text-red-300">{venueRequestError}</p>}
                    {venueRequestMessage && <p className="text-xs text-emerald-300">{venueRequestMessage}</p>}
                    <button type="submit" disabled={venueRequestSubmitting} className="w-full rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">
                      {venueRequestSubmitting ? 'Sending request...' : 'Send booking request'}
                    </button>
                  </form>
                )}
              </div>

              {artist.past_events && artist.past_events.length > 0 && (
                <div className="agg-panel agg-corner-frame p-6">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-alpine">Recently hosted</p>
                  <h2 className="agg-display mt-2 text-2xl font-semibold text-sun-gold">Past Shows</h2>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {artist.past_events.slice(0, 8).map((event) => (
                      <Link key={event.id} href={`/eventRouter/${event.slug}`} className="rounded-xl border border-slate-800 bg-black/35 p-4 transition hover:border-emerald-400/60">
                        <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">{formatEventDateLine(event)}</p>
                        <h3 className="mt-1 font-semibold text-white">{event.title}</h3>
                        <p className="mt-1 text-xs text-slate-400">{event.genre || 'Live music'}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {shouldBlur && (
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-5 text-center text-sm text-emerald-100">
              <p className="text-base font-semibold text-slate-50">{limitedHeadline}</p>
              <p className="mt-2 text-sm text-slate-100">{limitedBody}</p>
              {isOwner && (
                <div className="mt-3 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/upgrade"
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0"
                  >
                    Upgrade to Alpine Pro
                  </Link>
                </div>
              )}
            </div>
          )}

          {canManagePrivateTools && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-slate-950/80 to-black p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sun-gold">Owner dashboard</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Profile Action Plan</h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-300">
                      The most useful next steps for turning this page into a stronger booking, discovery, and promotion asset.
                    </p>
                  </div>
                  <Link
                    href={`/artists/edit/${artist.slug}`}
                    className="inline-flex items-center justify-center rounded-xl border border-gold/50 px-4 py-2.5 text-sm font-semibold text-sun-gold transition hover:border-sun-gold hover:text-ivory"
                  >
                    Manage page
                  </Link>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {profileActionPlan.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
                        item.tone === 'emerald'
                          ? 'border-emerald-400/30 bg-emerald-500/10 hover:border-emerald-300'
                          : item.tone === 'amber'
                          ? 'border-amber-400/30 bg-amber-500/10 hover:border-amber-300'
                          : item.tone === 'cyan'
                          ? 'border-cyan-400/30 bg-cyan-500/10 hover:border-cyan-300'
                          : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                      }`}
                    >
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 min-h-[3.75rem] text-xs leading-5 text-slate-300">{item.body}</p>
                      <span className="mt-3 inline-flex text-xs font-semibold text-sun-gold">
                        {item.action} →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Profile completeness</p>
                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-emerald-300/70 bg-slate-950 text-2xl font-black text-white">
                    {completeness.percent}%
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Make this page easier to book.</h2>
                    <p className="mt-1 text-sm text-slate-300">
                      {completeness.missing.length
                        ? `Next best improvements: ${completeness.missing.slice(0, 3).join(' ')}`
                        : 'This profile has the core booking assets in place.'}
                    </p>
                    <Link href={`/artists/edit/${artist.slug}`} className="mt-3 inline-flex rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
                      Improve profile
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Basic analytics</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Last 30 days</h2>
                {analyticsCounts ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Profile views', analyticsCounts.profile_view],
                      ['Embed views', analyticsCounts.embed_view],
                      ['Website clicks', analyticsCounts.website_click],
                      ['Ticket clicks', analyticsCounts.ticket_click],
                      ['Contact clicks', analyticsCounts.contact_click],
                      ['Tip clicks', analyticsCounts.tip_click],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{Number(value || 0)}</p>
                      </div>
                    ))}
                    <p className="col-span-2 text-xs text-slate-500">
                      Total tracked interactions: {analyticsTotal}. Analytics are intentionally simple for now.
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">Analytics will appear here once the profile starts receiving public traffic.</p>
                )}
              </div>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">About</h2>
              {isProAccess && <span className="text-xs uppercase tracking-[0.3em] text-emerald-300">PRO {profileLabel}</span>}
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="flex items-center gap-1">
                📧
                <span className={shouldBlur ? 'blur-sm select-none' : ''}>{bookingEmail}</span>
              </span>
              {artist.website && (
                <span className="flex items-center gap-1">
                  🔗
                  <a
                    href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={shouldBlur ? 'blur-sm pointer-events-none select-none' : 'underline'}
                  >
                    {artist.website}
                  </a>
                </span>
              )}
            </div>
          </section>

          {(artist.embed_youtube || artist.embed_soundcloud || artist.embed_bandcamp) && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-2xl font-semibold text-white">{isVenue ? 'Venue Media & Links' : 'Media & Links'}</h2>
              <div className={`mt-4 space-y-6 ${shouldBlur ? 'blur-sm pointer-events-none select-none' : ''}`}>
                {artist.embed_youtube && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Video</h3>
                    <div className="mt-2 aspect-video overflow-hidden rounded-xl border border-slate-800">
                      <iframe src={artist.embed_youtube} className="h-full w-full" allowFullScreen />
                    </div>
                  </div>
                )}
                {artist.embed_soundcloud && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">SoundCloud</h3>
                    <ResponsiveMediaEmbed
                      provider="soundcloud"
                      src={artist.embed_soundcloud}
                      title={`${artist.display_name} SoundCloud`}
                    />
                  </div>
                )}
                {artist.embed_bandcamp && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Bandcamp</h3>
                    <ResponsiveMediaEmbed
                      provider="bandcamp"
                      src={artist.embed_bandcamp}
                      title={`${artist.display_name} Bandcamp`}
                    />
                  </div>
                )}
              </div>
              {shouldBlur && (
                <div className="mt-3 text-center text-xs text-slate-400">
                  {isOwner
                    ? "Media embeds stay hidden from fans until you upgrade to Alpine Pro."
                    : "This page’s media stays hidden until they upgrade to Alpine Pro."}
                  {isOwner && (
                    <>
                      {" "}
                      <Link href="/upgrade" className="text-emerald-300 underline">
                        Upgrade now
                      </Link>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {(artist.promo_photo || artist.stage_plot || artist.press_kit) && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-2xl font-semibold text-white">Downloads</h2>
              <div className={`mt-4 space-y-2 text-sm ${shouldBlur ? 'blur-sm pointer-events-none select-none' : ''}`}>
                {artist.promo_photo && (
                  <a href={artist.promo_photo} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">
                    📸 {isVenue ? 'Room / Stage Photo' : 'Promo Photo'}
                  </a>
                )}
                {artist.stage_plot && (
                  <a href={artist.stage_plot} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">
                    🎚️ {isVenue ? 'House Stage / Tech Specs' : 'Stage Plot'}
                  </a>
                )}
                {artist.press_kit && (
                  <a href={artist.press_kit} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">
                    📄 {isVenue ? 'Venue Booking Packet' : 'Press Kit'}
                  </a>
                )}
              </div>
              {shouldBlur && (
                <div className="mt-3 text-center text-xs text-slate-400">
                  {isOwner
                    ? "Downloads unlock for everyone once you upgrade to Alpine Pro."
                    : "Downloads are hidden because this page hasn’t upgraded to Alpine Pro yet."}
                  {isOwner && (
                    <>
                      {" "}
                      <Link href="/upgrade" className="text-emerald-300 underline">
                        Manage plan
                      </Link>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          <section id="upcoming-dates" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-2xl font-semibold text-white">
              {isVenue ? 'Upcoming Shows at This Venue' : 'Upcoming Shows'}
            </h2>
            <div className="mt-4">
              {artist.events && artist.events.length > 0 ? (
                <div className={shouldBlur ? 'relative blur-sm pointer-events-none select-none' : ''}>
                  {artist.events.map((event) => {
                    const dateObj = event.date ? parseLocalDayjs(event.date) : null;
                    const dateValid = dateObj?.isValid();
                    const startDateTime = buildEventDateTime(event.date, event.start_time);
                    const timeObj = startDateTime ? dayjs(startDateTime) : null;
                    const timeValid = timeObj?.isValid();
                    const dateLabel = dateValid ? dateObj!.format('ddd, MMM D') : null;
                    const timeLabel = timeValid ? timeObj!.format('h:mm A') : null;
                    const dateLine = dateLabel ? (timeLabel ? `${dateLabel} • ${timeLabel}` : dateLabel) : timeLabel;

                    const promo = buildPromoCopy(event, artist.display_name);
                    const ticketUrl = normalizeExternalUrl(event.website_link);

                    return (
                      <div key={event.id} className="mb-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 transition hover:border-emerald-400/60 hover:bg-slate-900 last:mb-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                          <Link href={`/eventRouter/${event.slug}`} className="contents">
                            <EventPoster
                              posterUrl={event.display_image_url || event.poster}
                              title={event.title}
                              variant="card"
                              fit={event.source || event.source_label ? 'contain' : 'cover'}
                              className="h-40 w-full flex-shrink-0 sm:h-40 sm:w-32"
                            />
                            <div className="flex flex-1 flex-col justify-center sm:mt-0">
                              {dateLine && (
                                <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-300">{dateLine}</p>
                              )}
                              <h3 className="mt-1 text-sm font-semibold leading-tight text-white sm:text-base">{event.title}</h3>
                              <p className="text-xs text-slate-300 sm:text-sm">
                                📍 {event.venue_name} {event.location ? `• ${event.location}` : ''}
                              </p>
                              <p className="text-[11px] text-slate-400 sm:text-xs">🎵 {event.genre}</p>
                            </div>
                          </Link>
                          {ticketUrl && (
                            <a
                              href={ticketUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => trackArtistEvent('ticket_click', { eventId: event.id })}
                              className="rounded-xl border border-amber-400/50 bg-amber-500/10 px-4 py-2 text-center text-xs font-semibold text-amber-100 hover:border-amber-300"
                            >
                              Tickets / info
                            </a>
                          )}
                        </div>

                        {canEdit && (
                          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Promo copy</p>
                            <p className="mt-1 text-sm text-slate-300">{promo.sms}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {[
                                ['instagram', 'Instagram caption', promo.instagram],
                                ['facebook', 'Facebook text', promo.facebook],
                                ['sms', 'Short SMS', promo.sms],
                              ].map(([key, label, text]) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => copyText(String(text), `${event.id}-${key}`)}
                                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-300 hover:text-white"
                                >
                                  {copiedPromoKey === `${event.id}-${key}` ? 'Copied' : `Copy ${label}`}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  {isVenue ? 'No upcoming shows are listed for this venue yet.' : 'No upcoming events listed.'}
                </p>
              )}
              {shouldBlur && (
                <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-center text-sm text-slate-300">
                  {isOwner
                    ? "Your full calendar will appear here once you upgrade to Alpine Pro."
                    : "This page’s full calendar will appear once they upgrade to Alpine Pro."}
                  {isOwner && (
                    <>
                      {" "}
                      <Link href="/upgrade" className="text-emerald-300 underline">
                        Upgrade
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>

          {canEdit && (
            <section className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                {isVenue ? 'Venue calendar embed' : 'Website embed'}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {isVenue ? 'Put your live music calendar on your venue website' : 'Put this schedule on your website'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                {isVenue
                  ? 'Copy this iframe into your venue site so fans always see your approved upcoming shows without double-entry.'
                  : 'Copy this iframe into any page builder or HTML block. Approved upcoming shows update automatically, and these settings let you match the widget to your site.'}
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-5">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Embed mode
                  <select
                    value={widgetOptions.embedMode}
                    onChange={(event) => setWidgetOptions((prev) => ({ ...prev, embedMode: event.target.value === 'top-picks' ? 'top-picks' : 'upcoming' }))}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-white"
                  >
                    <option value="upcoming">Upcoming Events</option>
                    <option value="top-picks">Top Picks</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Theme
                  <select
                    value={widgetOptions.theme}
                    onChange={(event) => setWidgetOptions((prev) => ({ ...prev, theme: event.target.value === 'light' ? 'light' : 'dark' }))}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-white"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Layout
                  <select
                    value={widgetOptions.layout}
                    onChange={(event) => setWidgetOptions((prev) => ({ ...prev, layout: event.target.value === 'compact' ? 'compact' : 'full' }))}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-white"
                  >
                    <option value="full">Full</option>
                    <option value="compact">Compact</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Count
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={widgetOptions.limit}
                    onChange={(event) => {
                      const next = Number.parseInt(event.target.value, 10);
                      setWidgetOptions((prev) => ({ ...prev, limit: Number.isFinite(next) ? Math.min(Math.max(next, 1), 12) : prev.limit }));
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-white"
                  />
                </label>
                {widgetOptions.embedMode === 'top-picks' && (
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:col-span-2">
                    Title override
                    <input
                      type="text"
                      maxLength={80}
                      value={widgetOptions.titleOverride}
                      onChange={(event) => setWidgetOptions((prev) => ({ ...prev, titleOverride: event.target.value }))}
                      placeholder="Top Picks"
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-white"
                    />
                  </label>
                )}
                <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={widgetOptions.showPoster}
                    onChange={(event) => setWidgetOptions((prev) => ({ ...prev, showPoster: event.target.checked }))}
                  />
                  Show poster
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={widgetOptions.showTicketButton}
                    onChange={(event) => setWidgetOptions((prev) => ({ ...prev, showTicketButton: event.target.checked }))}
                  />
                  Show ticket button
                </label>
              </div>
              {widgetOptions.embedMode === 'top-picks' && (
                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Choose Top Picks</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Select the approved upcoming events that should appear in this curated embed.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={saveTopPicks}
                      disabled={topPicksSaving}
                      className="rounded-xl border border-emerald-400/60 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {topPicksSaving ? 'Saving...' : 'Save Top Picks'}
                    </button>
                  </div>
                  {topPicksError && (
                    <p className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">{topPicksError}</p>
                  )}
                  {topPicksStatus && (
                    <p className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">{topPicksStatus}</p>
                  )}
                  <div className="mt-4 space-y-2">
                    {topPickEvents.length > 0 ? (
                      topPickEvents.map((event) => {
                        const date = event.date ? parseLocalDayjs(event.date) : null;
                        const dateLabel = date?.isValid() ? date.format('ddd, MMM D') : 'Date TBA';
                        const time = buildEventDateTime(event.date, event.start_time);
                        const timeLabel = time && dayjs(time).isValid() ? dayjs(time).format('h:mm A') : null;
                        return (
                          <label
                            key={event.id}
                            className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-200"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTopPickIds.includes(event.id)}
                              onChange={(changeEvent) => toggleTopPick(event.id, changeEvent.target.checked)}
                              className="mt-1"
                            />
                            <span className="min-w-0">
                              <span className="block font-semibold text-white">{event.title}</span>
                              <span className="mt-0.5 block text-xs text-slate-400">
                                {dateLabel}{timeLabel ? ` • ${timeLabel}` : ''}{event.venue_name ? ` • ${event.venue_name}` : ''}
                              </span>
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
                        No approved upcoming events are available for this profile yet.
                      </p>
                    )}
                  </div>
                  {selectedTopPickIds.length === 0 && (
                    <p className="mt-3 text-xs text-slate-500">
                      Previewing the Top Picks embed will show an empty state until you select and save at least one event.
                    </p>
                  )}
                </div>
              )}
              <textarea
                readOnly
                value={embedSnippet}
                aria-label={`${profileLabel} schedule embed code`}
                className="mt-4 h-32 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-200"
                onFocus={(event) => event.currentTarget.select()}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(embedSnippet);
                    setEmbedCopied(true);
                    window.setTimeout(() => setEmbedCopied(false), 2500);
                  }}
                  className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  {embedCopied ? 'Copied' : 'Copy embed code'}
                </button>
                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-emerald-200 underline-offset-4 hover:underline"
                >
                  Preview widget ↗
                </a>
              </div>
            </section>
          )}

          {canEdit && (
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push(`/artists/edit/${artist.slug}`)}
                className="flex-1 rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-300 hover:text-white"
              >
                ✏️ Edit {profileLabel} Profile
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:border-red-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                🗑️ Delete Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug as string;
  const cookie = context.req.headers.cookie || '';

  if (isMusicRegionSlug(slug)) {
    return {
      redirect: {
        destination: `/artists?region=${slug}`,
        permanent: false,
      },
    };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${slug}`, {
      headers: { cookie },
    });

    if (res.status === 403) {
      return {
        redirect: { destination: `/UserProfile?pending=true`, permanent: false },
      };
    }

    if (!res.ok) return { notFound: true };

    const artist = await res.json();
    const accessState = artist?.access_state ?? 'none';

    if (!artist || (!artist.is_owner && accessState === 'none')) {
      return { notFound: true };
    }

    return { props: { artist } };
  } catch (err) {
    console.error('GSSP /artists/[slug] error:', err);
    return { props: { artist: null } };
  }
};

export default ArtistProfilePage;
