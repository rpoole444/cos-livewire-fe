import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_REGION, MUSIC_REGIONS } from '@/constants/regions';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const IMPORT_API_BASE = `${API_BASE_URL}/api/imports`;

type ProfileOption = {
  id: number;
  display_name: string;
  slug: string;
  profile_type: 'artist' | 'venue' | 'promoter';
  home_region?: string | null;
  venue_address?: string | null;
  venue_city?: string | null;
  venue_state?: string | null;
  website?: string | null;
  age_policy?: string | null;
  profile_image?: string | null;
  is_shell?: boolean | null;
};

type ImportMode = 'profile' | 'moondog';
type OwnerPolicy = 'no_owner' | 'personal_calendar';

type RecentImportBatch = {
  id: number | string;
  source: string;
  source_name?: string | null;
  status?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  last_activity_at?: string | null;
  event_count?: number;
  pending_count?: number;
  accepted_count?: number;
  rejected_count?: number;
  promoted_count?: number;
};

type GoogleCalendarOption = {
  id: string;
  summary: string;
  description?: string | null;
  primary?: boolean;
  accessRole?: string;
};

type GooglePreviewEvent = {
  google_event_id?: string | null;
  google_calendar_id?: string | null;
  title: string;
  artist_display?: string | null;
  venue_name?: string | null;
  location?: string | null;
  description?: string | null;
  website?: string | null;
  website_link?: string | null;
  poster?: string | null;
  start_at?: string;
  date: string;
  start_time: string;
  end_time?: string | null;
  raw_block?: string | null;
  parse_warnings?: string[];
  duplicate_warnings?: Array<{
    level?: string;
    reason?: string;
    existing_event_id?: number | null;
    existing_title?: string | null;
  }>;
  fingerprint?: string;
};

type ImportDefaults = {
  artist_profile_id: string;
  venue_profile_id: string;
  artist_display: string;
  venue_name: string;
  address: string;
  city: string;
  website: string;
  age_policy: string;
  poster: string;
  region: string;
};

const blankDefaults = (): ImportDefaults => ({
  artist_profile_id: '',
  venue_profile_id: '',
  artist_display: '',
  venue_name: '',
  address: '',
  city: '',
  website: '',
  age_policy: '',
  poster: '',
  region: DEFAULT_REGION,
});

const profileTypeLabel = (type: ProfileOption['profile_type']) => {
  if (type === 'venue') return 'Venue';
  if (type === 'promoter') return 'Promoter';
  return 'Artist';
};

const AdminImportPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [profileOptions, setProfileOptions] = useState<ProfileOption[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('profile');
  const [ownerPolicy, setOwnerPolicy] = useState<OwnerPolicy>('no_owner');
  const [importDefaults, setImportDefaults] = useState<ImportDefaults>(blankDefaults);
  const [shellDraft, setShellDraft] = useState({
    display_name: '',
    profile_type: 'venue',
    home_region: DEFAULT_REGION,
    profile_image: '',
    website: '',
    venue_address: '',
    venue_city: '',
    venue_state: 'CO',
    age_policy: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingShell, setIsCreatingShell] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error' | null>(null);
  const [recentBatches, setRecentBatches] = useState<RecentImportBatch[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendarOption[]>([]);
  const [googleCalendarId, setGoogleCalendarId] = useState('');
  const [googleDateStart, setGoogleDateStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [googleDateEnd, setGoogleDateEnd] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 60);
    return date.toISOString().slice(0, 10);
  });
  const [googlePreviewEvents, setGooglePreviewEvents] = useState<GooglePreviewEvent[]>([]);
  const [selectedGoogleEventIds, setSelectedGoogleEventIds] = useState<string[]>([]);
  const [googleImporting, setGoogleImporting] = useState(false);
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  const isAdmin = Boolean(user?.is_admin);
  const hasBulkImportAccess = isAdmin || profileOptions.length > 0;
  const selectedProfile = useMemo(
    () => profileOptions.find((profile) => String(profile.id) === selectedProfileId) || null,
    [profileOptions, selectedProfileId]
  );

  useEffect(() => {
    if (!router.isReady || loading) return;
    if (!user) {
      router.replace(`/LoginPage?redirect=${encodeURIComponent(router.asPath)}`);
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;

    const fetchProfileOptions = async () => {
      setProfilesLoaded(false);
      try {
        const endpoint = isAdmin ? '/api/artists/admin/options' : '/api/artists/mine';
        const res = await fetch(`${API_BASE_URL}${endpoint}`, { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || 'Unable to load profile options.');
        }

        const profiles = isAdmin
          ? (Array.isArray(data) ? data : [])
          : (Array.isArray(data?.profiles) ? data.profiles : []);
        setProfileOptions(profiles);

        if (!isAdmin && profiles.length === 1) {
          applySelectedProfile(String(profiles[0].id), profiles);
        }
      } catch (error) {
        console.error('Unable to load import profile options', error);
      } finally {
        setProfilesLoaded(true);
      }
    };

    fetchProfileOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, user]);

  const fetchRecentBatches = async () => {
    if (!user || !hasBulkImportAccess) return;
    setRecentLoading(true);
    try {
      const res = await fetch(`${IMPORT_API_BASE}/recent?limit=12`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Unable to load recent imports.');
      setRecentBatches(Array.isArray(data?.batches) ? data.batches : []);
    } catch (error) {
      console.error('Unable to load recent import batches', error);
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !profilesLoaded || !hasBulkImportAccess) return;
    fetchRecentBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profilesLoaded, hasBulkImportAccess]);

  useEffect(() => {
    if (!user || !profilesLoaded || !hasBulkImportAccess) return;

    const checkGoogleStatus = async () => {
      try {
        const res = await fetch(`${IMPORT_API_BASE}/google/status`, { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (res.ok) setGoogleConnected(Boolean(data?.connected));
      } catch (error) {
        console.error('Unable to check Google Calendar status', error);
      }
    };

    checkGoogleStatus();
  }, [user, profilesLoaded, hasBulkImportAccess]);

  useEffect(() => {
    if (!router.isReady) return;
    const googleState = Array.isArray(router.query.google) ? router.query.google[0] : router.query.google;
    const message = Array.isArray(router.query.message) ? router.query.message[0] : router.query.message;
    if (googleState === 'connected') {
      setGoogleConnected(true);
      setStatusMessage('Google Calendar connected. Choose a calendar and preview events.');
      setStatusTone('success');
      router.replace('/admin/import', undefined, { shallow: true });
    } else if (googleState === 'error') {
      setStatusMessage(message || 'Google Calendar connection failed.');
      setStatusTone('error');
      router.replace('/admin/import', undefined, { shallow: true });
    }
  }, [router]);

  const refreshProfileOptions = async () => {
    const endpoint = isAdmin ? '/api/artists/admin/options' : '/api/artists/mine';
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Unable to load profile options.');
    const profiles = isAdmin
      ? (Array.isArray(data) ? data : [])
      : (Array.isArray(data?.profiles) ? data.profiles : []);
    setProfileOptions(profiles);
    return profiles as ProfileOption[];
  };

  useEffect(() => {
    if (!router.isReady || !profileOptions.length || selectedProfileId) return;
    const profileId = Array.isArray(router.query.profile) ? router.query.profile[0] : router.query.profile;
    if (profileId && profileOptions.some((profile) => String(profile.id) === String(profileId))) {
      setImportMode('profile');
      applySelectedProfile(String(profileId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileOptions, router.isReady, router.query.profile, selectedProfileId]);

  const applySelectedProfile = (profileId: string, options = profileOptions) => {
    setSelectedProfileId(profileId);
    const profile = options.find((item) => String(item.id) === profileId);
    if (!profile) {
      setImportDefaults(blankDefaults());
      return;
    }

    const nextDefaults = blankDefaults();
    nextDefaults.website = profile.website || '';
    nextDefaults.poster = profile.profile_image || '';
    nextDefaults.region = profile.home_region || DEFAULT_REGION;

    if (profile.profile_type === 'artist') {
      nextDefaults.artist_profile_id = String(profile.id);
      nextDefaults.artist_display = profile.display_name || '';
    }

    if (profile.profile_type === 'venue') {
      nextDefaults.venue_profile_id = String(profile.id);
      nextDefaults.venue_name = profile.display_name || '';
      nextDefaults.address = profile.venue_address || '';
      nextDefaults.city = profile.venue_city || '';
      nextDefaults.age_policy = profile.age_policy || '';
    }

    setImportDefaults(nextDefaults);
  };

  const selectedGoogleCalendar = useMemo(
    () => googleCalendars.find((calendar) => calendar.id === googleCalendarId) || null,
    [googleCalendarId, googleCalendars]
  );

  const googleSelectedEvents = useMemo(
    () => googlePreviewEvents.filter((event) => selectedGoogleEventIds.includes(event.google_event_id || event.fingerprint || event.title)),
    [googlePreviewEvents, selectedGoogleEventIds]
  );

  const connectGoogleCalendar = async () => {
    setGoogleLoading(true);
    setStatusMessage(null);
    setStatusTone(null);
    try {
      const res = await fetch(`${IMPORT_API_BASE}/google/connect`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.authUrl) throw new Error(data?.message || 'Unable to start Google Calendar connection.');
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Google Calendar connect failed:', error);
      setStatusMessage(error instanceof Error ? error.message : 'Unable to connect Google Calendar.');
      setStatusTone('error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    setGoogleLoading(true);
    setStatusMessage(null);
    setStatusTone(null);
    try {
      const res = await fetch(`${IMPORT_API_BASE}/google/disconnect`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Unable to disconnect Google Calendar.');
      setGoogleConnected(false);
      setGoogleCalendars([]);
      setGoogleCalendarId('');
      setGooglePreviewEvents([]);
      setSelectedGoogleEventIds([]);
      setStatusMessage('Google Calendar disconnected. Connect again to choose the correct Google account.');
      setStatusTone('success');
    } catch (error) {
      console.error('Google Calendar disconnect failed:', error);
      setStatusMessage(error instanceof Error ? error.message : 'Unable to disconnect Google Calendar.');
      setStatusTone('error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const loadGoogleCalendars = async () => {
    setGoogleLoading(true);
    setStatusMessage(null);
    setStatusTone(null);
    try {
      const res = await fetch(`${IMPORT_API_BASE}/google/calendars`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Unable to load Google calendars.');
      const calendars = Array.isArray(data?.calendars) ? data.calendars : [];
      setGoogleCalendars(calendars);
      if (!googleCalendarId && calendars.length) {
        const primary = calendars.find((calendar: GoogleCalendarOption) => calendar.primary) || calendars[0];
        setGoogleCalendarId(primary.id);
      }
    } catch (error) {
      console.error('Google Calendar load failed:', error);
      setStatusMessage(error instanceof Error ? error.message : 'Unable to load Google calendars.');
      setStatusTone('error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const previewGoogleEvents = async () => {
    if (!googleCalendarId || !googleDateStart || !googleDateEnd) return;
    setGoogleLoading(true);
    setStatusMessage(null);
    setStatusTone(null);
    try {
      const start = new Date(`${googleDateStart}T00:00:00`);
      const end = new Date(`${googleDateEnd}T23:59:59`);
      const params = new URLSearchParams({
        calendarId: googleCalendarId,
        calendarSummary: selectedGoogleCalendar?.summary || '',
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
      });
      const res = await fetch(`${IMPORT_API_BASE}/google/events?${params.toString()}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Unable to preview Google Calendar events.');
      const events = Array.isArray(data?.events) ? data.events : [];
      setGooglePreviewEvents(events);
      setSelectedGoogleEventIds(events.map((event: GooglePreviewEvent) => event.google_event_id || event.fingerprint || event.title));
      setStatusMessage(events.length ? `${events.length} Google Calendar events ready to review.` : 'No Google Calendar events found in that range.');
      setStatusTone(events.length ? 'success' : null);
    } catch (error) {
      console.error('Google Calendar preview failed:', error);
      setStatusMessage(error instanceof Error ? error.message : 'Unable to preview Google Calendar events.');
      setStatusTone('error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const stageGoogleEvents = async () => {
    if (!googleSelectedEvents.length || googleImporting) return;
    setGoogleImporting(true);
    setStatusMessage(null);
    setStatusTone(null);
    try {
      const res = await fetch(`${IMPORT_API_BASE}/google/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          calendar_id: googleCalendarId,
          calendar_summary: selectedGoogleCalendar?.summary || '',
          events: googleSelectedEvents,
          defaults: {
            ...importDefaults,
            owner_policy: ownerPolicy,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Unable to stage Google Calendar events.');
      const batchId = data?.batchId ?? data?.batch_id ?? data?.id;
      if (!batchId) throw new Error('Google Calendar import succeeded but no batch ID was returned.');
      setStatusMessage('Google Calendar events staged. Redirecting to review...');
      setStatusTone('success');
      fetchRecentBatches();
      router.push(`/admin/imports/${batchId}?source=google_calendar`);
    } catch (error) {
      console.error('Google Calendar stage failed:', error);
      setStatusMessage(error instanceof Error ? error.message : 'Unable to stage Google Calendar events.');
      setStatusTone('error');
    } finally {
      setGoogleImporting(false);
    }
  };

  const submitLabel = isSubmitting
    ? 'Parsing...'
    : selectedProfile
    ? `Parse for ${selectedProfile.display_name}`
    : importMode === 'moondog'
    ? 'Parse Moondog listings'
    : 'Parse bulk listings';

  const ownershipLabel = ownerPolicy === 'personal_calendar'
    ? 'My Personal Calendar'
    : 'No Owner — Public Calendar Only';
  const estimatedEventCount = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && line.includes(','))
    .length;

  if (loading || !user || !profilesLoaded) {
    return (
      <>
        <Head>
          <title>Bulk Import – Alpine Groove Guide</title>
        </Head>
        <div className="min-h-screen bg-gray-950 px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Import</p>
            <h1 className="mt-2 text-2xl font-semibold">Checking access...</h1>
            <p className="mt-2 text-sm text-slate-400">Log in to bulk-add events with your profile defaults.</p>
          </div>
        </div>
      </>
    );
  }

  if (!hasBulkImportAccess) {
    return (
      <>
        <Head>
          <title>Bulk Import Access – Alpine Groove Guide</title>
        </Head>
        <div className="min-h-screen bg-gray-950 px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Profile tool</p>
            <h1 className="mt-3 text-3xl font-semibold">Create a public profile to bulk import events.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Bulk imports are for artists, venues, promoters, and admins because imported batches need a public music
              context and review ownership. Regular listener accounts can still submit a single event.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/artist-signup"
                className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 font-semibold text-emerald-100 transition hover:border-emerald-300"
              >
                Create Artist / Promoter Page
              </Link>
              <Link
                href="/venue-signup"
                className="rounded-2xl border border-sun-gold/40 bg-sun-gold/10 p-4 font-semibold text-sun-gold transition hover:border-sun-gold"
              >
                Create Venue Page
              </Link>
              <Link
                href="/eventSubmission"
                className="rounded-2xl border border-slate-700 bg-slate-900 p-4 font-semibold text-slate-100 transition hover:border-slate-500 sm:col-span-2"
              >
                Submit One Event Instead
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Bulk Import – Alpine Groove Guide</title>
      </Head>
      <div className="min-h-screen bg-gray-950 px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-4xl space-y-8">
          <header className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
              {isAdmin ? 'Admin + Profile Tools' : 'Profile Tools'}
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Bulk event import</h1>
            <p className="mt-2 text-sm text-slate-400">
              Paste a weekly schedule, apply profile defaults, review the staged rows, then send clean events into the
              normal calendar review process.
            </p>
          </header>

          <section className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Recent import batches</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Parsed rows are saved on the server. If you leave or refresh the review screen, continue from here.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchRecentBatches}
                disabled={recentLoading}
                className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {recentLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {recentLoading && !recentBatches.length && (
                <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                  Loading saved batches...
                </p>
              )}
              {!recentLoading && !recentBatches.length && (
                <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                  No saved import batches yet.
                </p>
              )}
              {recentBatches.map((batch) => {
                const pending = Number(batch.pending_count || 0);
                const accepted = Number(batch.accepted_count || 0);
                const rejected = Number(batch.rejected_count || 0);
                const promoted = Number(batch.promoted_count || 0);
                const total = Number(batch.event_count || 0);
                const isDone = batch.status === 'completed';
                const label = batch.source_name || (batch.source === 'moondog' ? 'Moondog import' : 'Profile import');

                return (
                  <Link
                    key={`${batch.source}-${batch.id}`}
                    href={`/admin/imports/${batch.id}?source=${batch.source || 'profile'}`}
                    className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-emerald-400/50 hover:bg-slate-900/80"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-100">{label}</p>
                          <span className="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                            {batch.source}
                          </span>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            isDone
                              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                              : pending
                                ? 'border-amber-400/40 bg-amber-500/10 text-amber-200'
                                : 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200'
                          }`}>
                            {isDone ? 'completed' : pending ? 'unfinished' : 'ready'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Batch #{batch.id}
                          {batch.created_at ? ` · created ${new Date(batch.created_at).toLocaleString()}` : ''}
                          {batch.last_activity_at ? ` · last activity ${new Date(batch.last_activity_at).toLocaleString()}` : ''}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 sm:grid-cols-5">
                        {[
                          ['Rows', total],
                          ['Pending', pending],
                          ['Accepted', accepted],
                          ['Rejected', rejected],
                          ['Moved', promoted],
                        ].map(([itemLabel, value]) => (
                          <div key={itemLabel} className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-center">
                            <p className="font-semibold text-slate-100">{value}</p>
                            <p className="mt-0.5 uppercase tracking-wide text-slate-500">{itemLabel}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section id="google-calendar" className="scroll-mt-24 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 shadow-2xl shadow-emerald-950/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">Recommended import path</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Import from Google Calendar</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">
                  Connect a calendar, choose a date range, preview the events, select only what belongs on Alpine Groove
                  Guide, then stage them for the same review flow as paste imports.
                </p>
              </div>
              <button
                type="button"
                onClick={googleConnected ? loadGoogleCalendars : connectGoogleCalendar}
                disabled={googleLoading}
                className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {googleLoading
                  ? 'Working...'
                  : googleConnected
                    ? 'Load calendars'
                    : 'Connect Google Calendar'}
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-slate-950/70 p-4 text-sm text-slate-300">
              <p>
                Privacy note: Alpine Groove Guide requests read-only calendar access. Nothing goes live automatically,
                and only selected preview rows are saved into the import review queue.
              </p>
              {user?.email && (
                <p className="mt-2 text-xs text-emerald-100/80">
                  We will ask Google to show the account chooser for <strong>{user.email}</strong>. If Google opens the
                  wrong account, use “Switch Google account” below and choose the matching email.
                </p>
              )}
            </div>

            {googleConnected && (
              <div className="mt-6 space-y-5">
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Google Calendar is connected for this Alpine session.</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Need a different Google account? Disconnect and reconnect; Google will show the account chooser.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={disconnectGoogleCalendar}
                    disabled={googleLoading}
                    className="rounded-full border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-emerald-300 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Switch Google account
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                    Calendar
                    <select
                      value={googleCalendarId}
                      onChange={(event) => setGoogleCalendarId(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-emerald-500/30 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                    >
                      {!googleCalendars.length && <option value="">Load calendars first</option>}
                      {googleCalendars.map((calendar) => (
                        <option key={calendar.id} value={calendar.id}>
                          {calendar.summary}{calendar.primary ? ' (Primary)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                    Start date
                    <input
                      type="date"
                      value={googleDateStart}
                      onChange={(event) => setGoogleDateStart(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-emerald-500/30 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                    End date
                    <input
                      type="date"
                      value={googleDateEnd}
                      onChange={(event) => setGoogleDateEnd(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-emerald-500/30 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                    Event ownership
                    <select
                      value={ownerPolicy}
                      onChange={(event) => setOwnerPolicy(event.target.value as OwnerPolicy)}
                      className="mt-1 w-full rounded-xl border border-emerald-500/30 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                    >
                      <option value="no_owner">No Owner — Public Calendar Only</option>
                      <option value="personal_calendar">My Personal Calendar</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                    Profile defaults
                    <select
                      value={selectedProfileId}
                      onChange={(event) => {
                        setImportMode('profile');
                        applySelectedProfile(event.target.value);
                      }}
                      className="mt-1 w-full rounded-xl border border-emerald-500/30 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                    >
                      <option value="">No profile defaults</option>
                      {profileOptions.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.display_name} ({profileTypeLabel(profile.profile_type)}{profile.is_shell ? ' shell' : ''})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={previewGoogleEvents}
                    disabled={googleLoading || !googleCalendarId || !googleDateStart || !googleDateEnd}
                    className="rounded-full border border-emerald-300/70 bg-emerald-300/10 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Preview calendar events
                  </button>
                  {googlePreviewEvents.length > 0 && (
                    <button
                      type="button"
                      onClick={stageGoogleEvents}
                      disabled={googleImporting || !googleSelectedEvents.length}
                      className="rounded-full bg-sun-gold px-5 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {googleImporting ? 'Staging...' : `Stage ${googleSelectedEvents.length} selected event${googleSelectedEvents.length === 1 ? '' : 's'}`}
                    </button>
                  )}
                </div>

                {googlePreviewEvents.length > 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80">
                    <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-white">Preview before staging</h3>
                        <p className="mt-1 text-xs text-slate-400">
                          Select only the events you want to save. You can edit every row on the next screen.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedGoogleEventIds(googlePreviewEvents.map((event) => event.google_event_id || event.fingerprint || event.title))}
                          className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-500"
                        >
                          Select all
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGoogleEventIds([])}
                          className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-500"
                        >
                          Select none
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[520px] divide-y divide-slate-800 overflow-y-auto">
                      {googlePreviewEvents.map((event) => {
                        const eventId = event.google_event_id || event.fingerprint || event.title;
                        const checked = selectedGoogleEventIds.includes(eventId);
                        const warnings = [
                          ...(event.parse_warnings || []),
                          ...(event.duplicate_warnings || []).map((warning) => warning.level || 'possible_duplicate'),
                        ];

                        return (
                          <label key={eventId} className="flex cursor-pointer gap-3 p-4 transition hover:bg-slate-900/70">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(changeEvent) => {
                                setSelectedGoogleEventIds((prev) => (
                                  changeEvent.target.checked
                                    ? Array.from(new Set([...prev, eventId]))
                                    : prev.filter((id) => id !== eventId)
                                ));
                              }}
                              className="mt-1 h-4 w-4"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-slate-100">{event.title}</p>
                                {warnings.map((warning) => (
                                  <span key={warning} className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                                    {warning.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                              <p className="mt-1 text-sm text-slate-400">
                                {event.date} · {event.start_time?.slice(0, 5)}
                                {event.venue_name || event.location ? ` · ${event.venue_name || event.location}` : ' · Location missing'}
                              </p>
                              {event.description && (
                                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{event.description}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section id="bulk-import" className="scroll-mt-24 rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
            <h2 className="text-xl font-semibold">Start a new import</h2>
            <p className="mt-2 text-sm text-slate-400">
              The parser accepts the simple Moondog-style format, but your selected profile can prefill images, links,
              region, artist links, or venue details. If a pasted venue matches an Alpine venue profile, we will use
              that venue image before falling back to the selected profile image or Alpine Groove Guide cover art.
            </p>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!rawText.trim() || isSubmitting) return;
                setIsSubmitting(true);
                setStatusMessage(null);
                setStatusTone(null);

                try {
                  const source = isAdmin && importMode === 'moondog' ? 'moondog' : 'profile';
                  const res = await fetch(`${IMPORT_API_BASE}/${source}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      raw_text: rawText,
                      source_name: sourceName,
                      source_url: sourceUrl,
                      defaults: {
                        ...importDefaults,
                        owner_policy: ownerPolicy,
                      },
                    }),
                  });

                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    setStatusMessage(data?.message || `Import failed with status ${res.status}`);
                    setStatusTone('error');
                    return;
                  }

                  const batchId = data?.batchId ?? data?.batch_id ?? data?.id;
                  if (!batchId) {
                    setStatusMessage('Import succeeded but no batch ID was returned.');
                    setStatusTone('error');
                    return;
                  }

                  setStatusMessage('Import started. Redirecting to staged rows...');
                  setStatusTone('success');
                  fetchRecentBatches();
                  router.push(`/admin/imports/${batchId}?source=${source}`);
                } catch (error) {
                  console.error('Import request failed:', error);
                  setStatusMessage('Something went wrong submitting the import.');
                  setStatusTone('error');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="mt-6 space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                {isAdmin && (
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Import source
                    <select
                      value={importMode}
                      onChange={(event) => {
                        const nextMode = event.target.value as ImportMode;
                        setImportMode(nextMode);
                        if (nextMode === 'moondog') {
                          setSelectedProfileId('');
                          setImportDefaults(blankDefaults());
                        }
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                    >
                      <option value="profile">Profile bulk import</option>
                      <option value="moondog">Moondog third-party calendar</option>
                    </select>
                  </label>
                )}
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Event ownership
                  <select
                    value={ownerPolicy}
                    onChange={(event) => setOwnerPolicy(event.target.value as OwnerPolicy)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                  >
                    <option value="no_owner">No Owner — Public Calendar Only</option>
                    <option value="personal_calendar">My Personal Calendar</option>
                  </select>
                  <span className="mt-2 block text-[11px] normal-case leading-5 tracking-normal text-slate-400">
                    Use No Owner for Dazzle, venue calendars, public listings, and imported events that should not attach
                    to your private calendar.
                  </span>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Use profile defaults
                  <select
                    value={selectedProfileId}
                    onChange={(event) => {
                      setImportMode('profile');
                      applySelectedProfile(event.target.value);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                  >
                      <option value="">No profile defaults</option>
                    {profileOptions.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.display_name} ({profileTypeLabel(profile.profile_type)}{profile.is_shell ? ' shell' : ''})
                      </option>
                    ))}
                  </select>
                  <span className="mt-2 block text-[11px] normal-case leading-5 tracking-normal text-slate-400">
                    Profile defaults prefill venue/artist details and images. They do not make the event privately owned
                    unless Event ownership is set to My Personal Calendar.
                  </span>
                </label>
              </div>

              {ownerPolicy === 'personal_calendar' && (
                <p className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Warning: these imported events will be attached to your personal/private calendar. Only use this for
                  your own gigs or events you intentionally want tied to your account.
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Source name
                  <input
                    value={sourceName}
                    onChange={(event) => setSourceName(event.target.value)}
                    placeholder="Alpine Groove Guide, venue calendar, partner calendar..."
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Source URL
                  <input
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                  />
                </label>
              </div>

              <textarea
                value={rawText}
                onChange={(event) => setRawText(event.target.value)}
                placeholder="Paste calendar listings here..."
                rows={10}
                className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />

              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
                <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <h3 className="text-sm font-semibold text-emerald-100">Import summary</h3>
                  <dl className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.18em] text-slate-500">Estimated rows</dt>
                      <dd className="mt-1">{estimatedEventCount || 'Paste listings to estimate'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.18em] text-slate-500">Owner</dt>
                      <dd className="mt-1">{ownershipLabel}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.18em] text-slate-500">Visibility</dt>
                      <dd className="mt-1">Public calendar review</dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-[0.18em] text-slate-500">Image fallback</dt>
                      <dd className="mt-1">Event image → Venue photo → Alpine default</dd>
                    </div>
                  </dl>
                </div>
                <h3 className="text-sm font-semibold text-slate-100">Defaults applied to parsed rows</h3>
                <p className="mt-1 text-xs text-slate-400">
                  These defaults fill missing fields only. After parsing, customize each event with its real show poster,
                  ticket link, description, and any details that make the listing stronger.
                </p>
                <p className="mt-2 text-xs text-sun-gold/90">
                  Image fallback order: event poster URL → matched venue profile image → selected profile image → source
                  fallback art. Create venue profiles with good photos to make calendar imports feel less generic.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Region
                    <select
                      value={importDefaults.region}
                      onChange={(event) => setImportDefaults((prev) => ({ ...prev, region: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                    >
                      {MUSIC_REGIONS.map((region) => (
                        <option key={region.slug} value={region.slug}>
                          {region.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {[
                    ['artist_display', 'Artist display'],
                    ['venue_name', 'Venue name'],
                    ['address', 'Address'],
                    ['city', 'City'],
                    ['website', 'Website'],
                    ['age_policy', 'Age policy'],
                    ['poster', 'Default image/poster URL'],
                  ].map(([field, label]) => (
                    <label key={field} className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {label}
                      <input
                        value={importDefaults[field as keyof ImportDefaults]}
                        onChange={(event) => setImportDefaults((prev) => ({ ...prev, [field]: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={isSubmitting || !rawText.trim()}
                  className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitLabel}
                </button>
                <Link
                  href={isAdmin ? '/AdminService' : '/UserProfile'}
                  className="rounded-full border border-slate-700/80 bg-slate-900 px-5 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  {isAdmin ? 'Review admin queue' : 'Back to profile'}
                </Link>
              </div>
              {statusMessage && (
                <p
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    statusTone === 'success'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                  }`}
                >
                  {statusMessage}
                </p>
              )}
            </form>
          </section>

          {isAdmin && (
            <section className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
              <h2 className="text-lg font-semibold text-slate-100">Create shell profile</h2>
              <p className="mt-2 text-sm text-slate-400">
                Create an unclaimed artist or venue profile before importing. Events can attach to it now, and the real
                artist or venue can claim the same profile later without losing those event connections.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Type
                  <select
                    value={shellDraft.profile_type}
                    onChange={(event) => setShellDraft((prev) => ({ ...prev, profile_type: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                  >
                    <option value="venue">Venue</option>
                    <option value="artist">Artist</option>
                    <option value="promoter">Promoter</option>
                  </select>
                </label>
                {[
                  ['display_name', 'Display name'],
                  ['profile_image', 'Default image URL'],
                  ['website', 'Website'],
                  ['venue_address', 'Venue address'],
                  ['venue_city', 'Venue city'],
                  ['venue_state', 'Venue state'],
                  ['age_policy', 'Age policy'],
                ].map(([field, label]) => (
                  <label key={field} className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {label}
                    <input
                      value={shellDraft[field as keyof typeof shellDraft]}
                      onChange={(event) => setShellDraft((prev) => ({ ...prev, [field]: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                    />
                  </label>
                ))}
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Home region
                  <select
                    value={shellDraft.home_region}
                    onChange={(event) => setShellDraft((prev) => ({ ...prev, home_region: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                  >
                    {MUSIC_REGIONS.map((region) => (
                      <option key={region.slug} value={region.slug}>
                        {region.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="button"
                disabled={isCreatingShell || !shellDraft.display_name.trim()}
                onClick={async () => {
                  setIsCreatingShell(true);
                  setStatusMessage(null);
                  setStatusTone(null);
                  try {
                    const res = await fetch(`${IMPORT_API_BASE}/shell-profiles`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify(shellDraft),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      throw new Error(data?.message || 'Unable to create shell profile.');
                    }
                    const profiles = await refreshProfileOptions();
                    const profileId = data?.profile?.id ? String(data.profile.id) : '';
                    if (profileId) {
                      applySelectedProfile(profileId, profiles);
                    }
                    setStatusMessage(data?.message || 'Shell profile ready. It can now be used as an import default.');
                    setStatusTone('success');
                  } catch (error) {
                    console.error('Shell profile creation failed:', error);
                    setStatusMessage(error instanceof Error ? error.message : 'Unable to create shell profile.');
                    setStatusTone('error');
                  } finally {
                    setIsCreatingShell(false);
                  }
                }}
                className="mt-5 rounded-full border border-sun-gold/50 bg-sun-gold/10 px-5 py-2 text-sm font-semibold text-sun-gold transition hover:border-sun-gold hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingShell ? 'Creating...' : 'Create shell profile'}
              </button>
            </section>
          )}

          <section className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
            <h2 className="text-lg font-semibold text-slate-100">Recommended paste format</h2>
            <p className="mt-2 text-sm text-slate-400">
              Minimum required: keep dates as headings, then use{' '}
              <span className="text-slate-200">Venue, Artist, Time</span>. That is enough to stage events.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-300">
{`Sunday, June 21

Armadillo Ranch, The Broken Rose Unplugged, 1 p.m.
Buffalo Lodge, RV Casino, Annette & Doug Conlon, Co Spgs Pickers, 2 p.m.
Cantina Verde, Matt Cravatta, 5 p.m.`}
            </pre>
            <div className="mt-6 rounded-2xl border border-sun-gold/30 bg-sun-gold/10 p-4">
              <h3 className="text-sm font-semibold text-sun-gold">Richer listings work better</h3>
              <p className="mt-2 text-sm text-slate-300">
                Add optional detail lines under a show when you have them. The parser will still accept the minimum
                format, and staged review is where missing fields can be cleaned up.
              </p>
              <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-300">
{`Wednesday, July 9

Lulu's Downtown, Poole & The Gang, 8 p.m.
Title: Scoop of Jazz with Poole & The Gang
Tickets: https://example.com/tickets
Website: https://example.com/show
Region: Colorado Springs
Age: 21+
Description: Summer jazz, funk, and dance-floor grooves.
Poster: https://example.com/show-poster.jpg`}
              </pre>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Profile and venue defaults are good for speed, but event-specific posters and descriptions are still the
              strongest version. After parsing, replace generic images with show posters whenever possible.
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default AdminImportPage;
