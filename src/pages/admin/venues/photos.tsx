import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { AlertTriangle, CheckCircle2, ExternalLink, ImagePlus, Loader2, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

type PhotoMatch = {
  file_path: string;
  filename_hint?: string;
  suggested_venue?: string;
  existing_profile_id?: number | null;
  confidence?: string;
  score?: number;
  reason?: string;
  current_profile_image?: string | null;
  proposed_action?: string;
};

type BrokenEventImage = {
  event_id: number;
  title?: string;
  slug?: string;
  date?: string;
  venue_name?: string;
  venue_profile_id?: number | null;
  current_poster?: string | null;
  image_status?: string;
  reason?: string;
  recommended_action?: string;
};

type MissingVenue = {
  name: string;
  region?: string | null;
  event_count?: number;
  confidence?: string;
  recommended_action?: string;
  sample_event_ids?: number[];
};

type BackfillPreview = {
  event_id: number;
  title?: string;
  slug?: string;
  venue_name?: string;
  venue_profile_id?: number | null;
  display_image_url?: string | null;
  display_image_source?: string;
  event_poster_status?: string;
};

type DryRunReport = {
  generated_at?: string;
  summary?: {
    photo_files_checked?: number;
    venue_photo_matches?: number;
    missing_venue_candidates?: number;
    broken_event_images?: number;
    event_image_backfill_candidates?: number;
  };
  photo_matches?: PhotoMatch[];
  missing_venues?: MissingVenue[];
  broken_event_images?: BrokenEventImage[];
  event_image_backfill_preview?: BackfillPreview[];
};

type ApplyResult = {
  execute?: boolean;
  applied?: {
    venue_photo_updates?: number;
    shell_venues_created?: number;
    event_image_repairs?: number;
  };
  preview?: {
    venue_photo_updates?: number;
    shell_venues?: number;
    event_image_repairs?: number;
  };
  errors?: string[];
};

type Approvals = {
  venue_photo_updates: Array<{
    profile_id: number;
    file_path?: string;
    image_url?: string;
  }>;
  shell_venues: Array<{
    display_name: string;
    region?: string | null;
  }>;
  event_image_repairs: Array<{
    event_id: number;
    use_venue_image?: boolean;
    use_default?: boolean;
  }>;
};

const defaultPhotoInputs = [
  '/Users/reidpoole/Downloads/pikespeakcenterlogo.avif',
  '/Users/reidpoole/Downloads/Phil Long Music Hall Logo.svg',
  '/Users/reidpoole/Downloads/Boulder Theater Logo.webp',
  '/Users/reidpoole/Downloads/Mission Ballroom Schedule.webp',
  '/Users/reidpoole/Downloads/RedRocks Logo.png',
  '/Users/reidpoole/Downloads/Ford Amphitheater hero-logo.png',
  '/Users/reidpoole/Downloads/Dazzle Logo.webp',
  '/Users/reidpoole/Downloads/Nocturne Logo.webp',
  '/Users/reidpoole/Downloads/Mining Exchange Logo.jpg',
  '/Users/reidpoole/Downloads/Black Sheep Logo.jpg',
  '/Users/reidpoole/Downloads/Tokki Logo.png',
].join('\n');

const splitInputs = (value: string) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const isRemoteUrl = (value: string) => /^https?:\/\//i.test(value);

const formatDate = (value?: string) => {
  if (!value) return 'Date TBA';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const countApplyItems = (approvals: Approvals) =>
  approvals.venue_photo_updates.length + approvals.shell_venues.length + approvals.event_image_repairs.length;

const AdminVenuePhotosPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [photoInputs, setPhotoInputs] = useState(defaultPhotoInputs);
  const [eventLimit, setEventLimit] = useState(250);
  const [report, setReport] = useState<DryRunReport | null>(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'success' | 'error' | 'info'>('info');
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
  const [selectedShellVenues, setSelectedShellVenues] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!router.isReady || loading) return;
    if (!user) {
      router.replace(`/LoginPage?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (!user.is_admin) {
      router.replace('/');
    }
  }, [loading, router, user]);

  const buildApprovals = useMemo<Approvals>(() => {
    const photoUpdates = (report?.photo_matches || [])
      .filter((match) => match.existing_profile_id && selectedPhotos.has(`${match.file_path}:${match.existing_profile_id}`))
      .map((match) => ({
        profile_id: Number(match.existing_profile_id),
        ...(isRemoteUrl(match.file_path) ? { image_url: match.file_path } : { file_path: match.file_path }),
      }));

    const shellVenues = (report?.missing_venues || [])
      .filter((venue) => selectedShellVenues.has(venue.name))
      .map((venue) => ({
        display_name: venue.name,
        region: venue.region || null,
      }));

    const eventRepairs = (report?.broken_event_images || [])
      .filter((event) => selectedEvents.has(event.event_id))
      .map((event) => ({
        event_id: event.event_id,
        use_venue_image: Boolean(event.venue_profile_id),
        use_default: true,
      }));

    return {
      venue_photo_updates: photoUpdates,
      shell_venues: shellVenues,
      event_image_repairs: eventRepairs,
    };
  }, [report, selectedEvents, selectedPhotos, selectedShellVenues]);

  const selectedCount = countApplyItems(buildApprovals);

  const setStatus = (message: string, tone: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage(message);
    setStatusTone(tone);
  };

  const runDryRun = async () => {
    const files = splitInputs(photoInputs);
    setDryRunLoading(true);
    setApplyResult(null);
    setStatus('', 'info');

    try {
      const params = new URLSearchParams();
      files.forEach((file) => params.append('file', file));
      params.set('eventLimit', String(Math.max(1, Math.min(Number(eventLimit) || 250, 1000))));

      const res = await fetch(`${API_BASE_URL}/api/admin/venue-photo-maintenance/dry-run?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Unable to generate venue photo report.');
      }

      setReport(data);
      const confidentPhotoKeys = new Set<string>();
      (data.photo_matches || []).forEach((match: PhotoMatch) => {
        if (match.existing_profile_id && ['high', 'medium'].includes(String(match.confidence || '').toLowerCase())) {
          confidentPhotoKeys.add(`${match.file_path}:${match.existing_profile_id}`);
        }
      });
      const brokenEventIds = new Set<number>();
      (data.broken_event_images || []).forEach((event: BrokenEventImage) => {
        brokenEventIds.add(event.event_id);
      });
      setSelectedPhotos(confidentPhotoKeys);
      setSelectedEvents(brokenEventIds);
      setSelectedShellVenues(new Set());
      setStatus('Dry run complete. Review the selected changes before previewing or applying.', 'success');
    } catch (error) {
      console.error(error);
      setReport(null);
      setStatus(error instanceof Error ? error.message : 'Unable to generate venue photo report.', 'error');
    } finally {
      setDryRunLoading(false);
    }
  };

  const runApply = async (execute: boolean) => {
    if (!selectedCount) {
      setStatus('Select at least one photo update, shell venue, or event image repair first.', 'error');
      return;
    }

    if (execute && !window.confirm('Apply these selected image maintenance changes to the live database?')) {
      return;
    }

    setApplyLoading(true);
    setApplyResult(null);
    setStatus(execute ? 'Applying selected changes...' : 'Previewing selected changes...', 'info');

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/venue-photo-maintenance/apply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ execute, approvals: buildApprovals }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Unable to apply venue photo maintenance plan.');
      }

      setApplyResult(data);
      setStatus(execute ? 'Selected changes were applied.' : 'Preview complete. Nothing was changed.', 'success');
      if (execute) {
        await runDryRun();
      }
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : 'Unable to apply venue photo maintenance plan.', 'error');
    } finally {
      setApplyLoading(false);
    }
  };

  const togglePhoto = (match: PhotoMatch) => {
    if (!match.existing_profile_id) return;
    const key = `${match.file_path}:${match.existing_profile_id}`;
    setSelectedPhotos((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleEvent = (eventId: number) => {
    setSelectedEvents((current) => {
      const next = new Set(current);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const toggleShellVenue = (name: string) => {
    setSelectedShellVenues((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (loading || !user || !user.is_admin) {
    return (
      <>
        <Head>
          <title>Venue Images - Alpine Groove Guide</title>
        </Head>
        <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
            <p className="text-sm text-slate-300">Checking admin access...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Venue Image Maintenance - Alpine Groove Guide</title>
      </Head>
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                  Admin Maintenance
                </p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Venue image cleanup
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                  Match venue logo files to venue profiles, find imported events with missing or broken posters, and
                  repair them using venue images or the Alpine Groove Guide fallback.
                </p>
              </div>
              <Link
                href="/AdminService"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/60 hover:text-white"
              >
                Back to admin
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </header>

          <section className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-50">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
              <div>
                <p className="font-semibold">Production note</p>
                <p className="mt-1 text-amber-100/90">
                  Local Mac file paths only work when the backend is running on this Mac. On production, use public image
                  URLs or run the backend apply script locally with production credentials. Every action below supports a
                  preview mode before it writes anything.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-white">Scan inputs</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Paste one local file path or public image URL per line. The dry run uses the filename to suggest venue
                matches and scans recent events for missing/broken images.
              </p>
              <label className="mt-5 block text-sm font-semibold text-slate-200" htmlFor="photo-inputs">
                Venue image files or URLs
              </label>
              <textarea
                id="photo-inputs"
                value={photoInputs}
                onChange={(event) => setPhotoInputs(event.target.value)}
                className="mt-2 min-h-[280px] w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                placeholder="/Users/reidpoole/Downloads/Black Sheep Logo.jpg"
              />
              <label className="mt-4 block text-sm font-semibold text-slate-200" htmlFor="event-limit">
                Event image scan limit
              </label>
              <input
                id="event-limit"
                type="number"
                min={1}
                max={1000}
                value={eventLimit}
                onChange={(event) => setEventLimit(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={runDryRun}
                disabled={dryRunLoading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {dryRunLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Run dry scan
              </button>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
                <h2 className="text-xl font-semibold text-white">Report summary</h2>
                {report ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ['Photo files checked', report.summary?.photo_files_checked || 0],
                      ['Venue matches', report.summary?.venue_photo_matches || 0],
                      ['Missing venue candidates', report.summary?.missing_venue_candidates || 0],
                      ['Broken event images', report.summary?.broken_event_images || 0],
                      ['Fallback candidates', report.summary?.event_image_backfill_candidates || 0],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">Run a dry scan to see suggested maintenance actions.</p>
                )}
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Selected actions</h2>
                    <p className="mt-1 text-sm text-slate-400">{selectedCount} selected change{selectedCount === 1 ? '' : 's'}.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => runApply(false)}
                      disabled={applyLoading || !selectedCount}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Preview apply
                    </button>
                    <button
                      type="button"
                      onClick={() => runApply(true)}
                      disabled={applyLoading || !selectedCount}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {applyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                      Apply selected
                    </button>
                  </div>
                </div>
                {statusMessage && (
                  <div
                    className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                      statusTone === 'error'
                        ? 'border-red-500/40 bg-red-500/10 text-red-100'
                        : statusTone === 'success'
                        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                        : 'border-slate-700 bg-slate-950/70 text-slate-200'
                    }`}
                  >
                    {statusMessage}
                  </div>
                )}
                {applyResult && (
                  <pre className="mt-4 max-h-72 overflow-auto rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-300">
                    {JSON.stringify(applyResult, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </section>

          {report && (
            <section className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
                <h2 className="text-xl font-semibold text-white">Venue photo matches</h2>
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
                  {(report.photo_matches || []).length ? (
                    <div className="divide-y divide-slate-800">
                      {(report.photo_matches || []).map((match) => {
                        const key = `${match.file_path}:${match.existing_profile_id}`;
                        const selected = selectedPhotos.has(key);
                        return (
                          <label key={key} className="flex cursor-pointer gap-4 bg-slate-950/50 p-4 transition hover:bg-slate-900">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 accent-emerald-400"
                              checked={selected}
                              disabled={!match.existing_profile_id}
                              onChange={() => togglePhoto(match)}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-white">{match.suggested_venue || match.filename_hint || 'Unknown venue'}</p>
                                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs uppercase tracking-wider text-slate-300">
                                  {match.confidence || 'unknown'}
                                </span>
                                {match.existing_profile_id ? (
                                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-100">
                                    profile #{match.existing_profile_id}
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-100">
                                    no profile match
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 truncate font-mono text-xs text-slate-500">{match.file_path}</p>
                              <p className="mt-2 text-sm text-slate-400">{match.reason || match.proposed_action || 'Suggested from filename match.'}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="p-4 text-sm text-slate-400">No venue photo matches found.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
                  <h2 className="text-xl font-semibold text-white">Broken or missing event posters</h2>
                  <div className="mt-4 space-y-3">
                    {(report.broken_event_images || []).length ? (
                      (report.broken_event_images || []).map((event) => (
                        <label
                          key={event.event_id}
                          className="flex cursor-pointer gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700"
                        >
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 accent-emerald-400"
                            checked={selectedEvents.has(event.event_id)}
                            onChange={() => toggleEvent(event.event_id)}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-white">{event.title || `Event #${event.event_id}`}</p>
                              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                                {event.image_status || 'missing'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-400">
                              {formatDate(event.date)} · {event.venue_name || 'Venue TBA'}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">{event.recommended_action || event.reason}</p>
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                        No broken event posters found in this scan window.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
                  <h2 className="text-xl font-semibold text-white">Shell venue candidates</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Use these carefully. Shell venues are lightweight profiles that make future imported events easier to
                    enrich and claim.
                  </p>
                  <div className="mt-4 space-y-3">
                    {(report.missing_venues || []).length ? (
                      (report.missing_venues || []).map((venue) => (
                        <label
                          key={venue.name}
                          className="flex cursor-pointer gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700"
                        >
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 accent-amber-400"
                            checked={selectedShellVenues.has(venue.name)}
                            onChange={() => toggleShellVenue(venue.name)}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-white">{venue.name}</p>
                              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                                {venue.event_count || 0} event{venue.event_count === 1 ? '' : 's'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-400">
                              Region: {venue.region || 'unknown'} · confidence: {venue.confidence || 'unknown'}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">{venue.recommended_action}</p>
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                        No shell venue candidates found.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  <h2 className="text-xl font-semibold text-white">Display fallback preview</h2>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  These rows already have a display image available through event poster, venue image, source image, or
                  Alpine Groove Guide fallback.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(report.event_image_backfill_preview || []).slice(0, 12).map((event) => (
                    <div key={event.event_id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="truncate font-semibold text-white">{event.title || `Event #${event.event_id}`}</p>
                      <p className="mt-1 text-sm text-slate-400">{event.venue_name || 'Venue TBA'}</p>
                      <p className="mt-2 rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">
                        source: {event.display_image_source || 'none'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
};

export default AdminVenuePhotosPage;
