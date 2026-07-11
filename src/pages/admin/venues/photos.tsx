import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCcw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { parseLocalDayjs } from '@/util/dateHelper';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

type PossibleMatch = {
  profile_id: number;
  display_name: string;
  slug?: string;
  confidence?: string;
  score?: number;
  reason?: string;
};

type SampleEvent = {
  id: number;
  title?: string;
  date?: string;
  venue_name?: string;
  address?: string | null;
  region?: string | null;
};

type MissingVenue = {
  name: string;
  normalized_name?: string;
  region?: string | null;
  regions?: string[];
  cities?: string[];
  addresses?: string[];
  event_count?: number;
  confidence?: string;
  recommended_action?: string;
  reason?: string;
  sample_event_ids?: number[];
  sample_events?: SampleEvent[];
  possible_matches?: PossibleMatch[];
  latest_date?: string | null;
};

type DryRunReport = {
  generated_at?: string;
  summary?: {
    venue_profile_count?: number;
    scanned_event_count?: number;
    missing_venue_candidates?: number;
    broken_or_default_event_images?: number;
  };
  missing_venues?: MissingVenue[];
  event_image_backfill_preview?: Array<{
    event_id: number;
    title?: string;
    venue_name?: string;
    proposed_display_fallback?: string | null;
    image_status?: string;
  }>;
};

type ApplyResult = {
  execute?: boolean;
  shell_venues_created?: Array<{
    display_name: string;
    slug?: string;
    profile_id?: number;
    action?: string;
  }>;
  skipped?: Array<{
    type?: string;
    reason?: string;
    display_name?: string;
    existing_profile_id?: number;
  }>;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Date TBA';
  const parsed = parseLocalDayjs(value);
  return parsed.isValid() ? parsed.format('MMM D, YYYY') : value;
};

const confidenceTone = (confidence?: string) => {
  if (confidence === 'high') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100';
  if (confidence === 'medium') return 'border-amber-400/40 bg-amber-500/10 text-amber-100';
  return 'border-slate-700 bg-slate-950/70 text-slate-300';
};

const candidateKey = (venue: MissingVenue) => venue.normalized_name || venue.name;

const AdminVenuePhotosPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [eventLimit, setEventLimit] = useState(2500);
  const [minEvents, setMinEvents] = useState(1);
  const [regionFilter, setRegionFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'count' | 'name' | 'recent'>('count');
  const [report, setReport] = useState<DryRunReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'success' | 'error' | 'info'>('info');
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const [selectedShellVenues, setSelectedShellVenues] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!router.isReady || loading) return;
    if (!user) {
      router.replace(`/LoginPage?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (!user.is_admin) router.replace('/');
  }, [loading, router, user]);

  const setStatus = (message: string, tone: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage(message);
    setStatusTone(tone);
  };

  const runAudit = async () => {
    setLoadingReport(true);
    setApplyResult(null);
    setStatus('', 'info');
    try {
      const params = new URLSearchParams();
      params.set('eventLimit', String(Math.max(1, Math.min(Number(eventLimit) || 2500, 5000))));
      params.set('missingVenueMinEvents', String(Math.max(1, Math.min(Number(minEvents) || 1, 20))));

      const res = await fetch(`${API_BASE_URL}/api/admin/venue-photo-maintenance/dry-run?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Unable to scan venue shells.');

      setReport(data);
      setSelectedShellVenues(new Set());
      setStatus('Venue shell audit complete. Review candidates before creating anything.', 'success');
    } catch (error) {
      console.error(error);
      setReport(null);
      setStatus(error instanceof Error ? error.message : 'Unable to scan venue shells.', 'error');
    } finally {
      setLoadingReport(false);
    }
  };

  const candidates = useMemo(() => report?.missing_venues || [], [report]);
  const regions = useMemo(() => {
    const values = new Set<string>();
    candidates.forEach((venue) => {
      if (venue.region) values.add(venue.region);
      (venue.regions || []).forEach((region) => region && values.add(region));
    });
    return Array.from(values).sort();
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return [...candidates]
      .filter((venue) => {
        if (regionFilter !== 'all' && venue.region !== regionFilter && !(venue.regions || []).includes(regionFilter)) return false;
        if (confidenceFilter !== 'all' && venue.confidence !== confidenceFilter) return false;
        if (!term) return true;
        return [
          venue.name,
          venue.region,
          ...(venue.cities || []),
          ...(venue.addresses || []),
          ...(venue.possible_matches || []).map((match) => match.display_name),
        ].filter(Boolean).join(' ').toLowerCase().includes(term);
      })
      .sort((a, b) => {
        if (sortKey === 'name') return a.name.localeCompare(b.name);
        if (sortKey === 'recent') return String(b.latest_date || '').localeCompare(String(a.latest_date || ''));
        return Number(b.event_count || 0) - Number(a.event_count || 0);
      });
  }, [candidates, confidenceFilter, regionFilter, searchTerm, sortKey]);

  const selectedCandidates = candidates.filter((venue) => selectedShellVenues.has(candidateKey(venue)));
  const selectedCount = selectedCandidates.length;

  const toggleShellVenue = (venue: MissingVenue) => {
    const key = candidateKey(venue);
    setSelectedShellVenues((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleVisibleCandidates = () => {
    const visibleKeys = filteredCandidates.map(candidateKey);
    const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((key) => selectedShellVenues.has(key));
    setSelectedShellVenues((current) => {
      const next = new Set(current);
      visibleKeys.forEach((key) => {
        if (allVisibleSelected) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  const createShellVenues = async (execute: boolean) => {
    if (!selectedCount) {
      setStatus('Select at least one venue candidate first.', 'error');
      return;
    }
    if (execute && !window.confirm(`Create ${selectedCount} shell venue profile(s)? Existing normalized matches will be skipped.`)) return;

    setApplyLoading(true);
    setApplyResult(null);
    setStatus(execute ? 'Creating selected shell venues...' : 'Previewing selected shell venues...', 'info');
    try {
      const approvals = {
        venue_photo_updates: [],
        event_image_repairs: [],
        shell_venues: selectedCandidates.map((venue) => ({
          display_name: venue.name,
          region: venue.region || null,
          city: venue.cities?.[0] || null,
          address: venue.addresses?.[0] || null,
          bio: `${venue.name} is an unclaimed venue profile on Alpine Groove Guide.`,
        })),
      };

      const res = await fetch(`${API_BASE_URL}/api/admin/venue-photo-maintenance/apply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ execute, approvals }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Unable to create shell venues.');

      setApplyResult(data);
      setStatus(execute ? 'Selected shell venues were created.' : 'Preview complete. Nothing was changed.', 'success');
      if (execute) await runAudit();
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : 'Unable to create shell venues.', 'error');
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading || !user || !user.is_admin) {
    return (
      <>
        <Head>
          <title>Venue Shell Audit - Alpine Groove Guide</title>
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
        <title>Venue Shell Audit - Alpine Groove Guide</title>
      </Head>
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                  Admin Venue Audit
                </p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Venue shell audit
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                  Find venue names that appear in events but do not yet have a venue profile or shell. Review likely matches,
                  then create only the shells that are safe.
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

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-white">Scan event venue names</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                This scans event venue names, normalizes punctuation/case/apostrophes, and compares them to existing venue
                profiles. No Google lookup or data writes happen during this scan.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <label className="block text-sm font-semibold text-slate-200">
                  Event scan limit
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={eventLimit}
                    onChange={(event) => setEventLimit(Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-200">
                  Minimum event count
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={minEvents}
                    onChange={(event) => setMinEvents(Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                  />
                </label>
                <button
                  type="button"
                  onClick={runAudit}
                  disabled={loadingReport}
                  className="self-end inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  Scan venues
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-white">Venue image fallback</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Older events now inherit venue images dynamically when they have no valid event poster and their venue name
                matches a venue profile. Valid event posters are preserved.
              </p>
              <p className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                Priority: event poster, then venue image, then source/default Alpine image.
              </p>
            </div>
          </section>

          {statusMessage && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                statusTone === 'error'
                  ? 'border-red-500/40 bg-red-500/10 text-red-100'
                  : statusTone === 'success'
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                  : 'border-slate-700 bg-slate-900/70 text-slate-200'
              }`}
            >
              {statusMessage}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ['Events scanned', report?.summary?.scanned_event_count || 0],
              ['Venue profiles', report?.summary?.venue_profile_count || 0],
              ['Missing shell candidates', report?.summary?.missing_venue_candidates || 0],
              ['Selected to create', selectedCount],
              ['Image fallback candidates', report?.event_image_backfill_preview?.length || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Missing venue candidates</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Select only obvious missing venues. Similar names are suggestions, not automatic merges.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={toggleVisibleCandidates}
                  disabled={!filteredCandidates.length || applyLoading}
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Toggle visible
                </button>
                <button
                  type="button"
                  onClick={() => createShellVenues(false)}
                  disabled={!selectedCount || applyLoading}
                  className="rounded-full border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Preview create
                </button>
                <button
                  type="button"
                  onClick={() => createShellVenues(true)}
                  disabled={!selectedCount || applyLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {applyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                  Create shells
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_0.45fr_0.45fr_0.45fr]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search venue, city, address, possible match"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                />
              </label>
              <select
                value={regionFilter}
                onChange={(event) => setRegionFilter(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              >
                <option value="all">All regions</option>
                {regions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <select
                value={confidenceFilter}
                onChange={(event) => setConfidenceFilter(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              >
                <option value="all">All confidence</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as 'count' | 'name' | 'recent')}
                className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              >
                <option value="count">Most events</option>
                <option value="recent">Newest occurrence</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            <div className="mt-5 space-y-3">
              {report ? (
                filteredCandidates.length ? (
                  filteredCandidates.map((venue) => {
                    const key = candidateKey(venue);
                    const selected = selectedShellVenues.has(key);
                    return (
                      <article
                        key={key}
                        className={`rounded-2xl border p-4 transition ${
                          selected ? 'border-amber-300/70 bg-amber-400/10' : 'border-slate-800 bg-slate-950/60'
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                          <label className="flex min-w-[10rem] cursor-pointer items-center gap-3 text-sm font-semibold text-slate-200">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-amber-400"
                              checked={selected}
                              onChange={() => toggleShellVenue(venue)}
                            />
                            {selected ? 'Create shell' : 'Skip'}
                          </label>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-white">{venue.name}</h3>
                              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                                {venue.event_count || 0} event{venue.event_count === 1 ? '' : 's'}
                              </span>
                              <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${confidenceTone(venue.confidence)}`}>
                                {venue.confidence || 'review'}
                              </span>
                            </div>
                            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                              <MapPin className="h-4 w-4" />
                              {venue.region || 'Region unknown'}
                              {venue.cities?.length ? ` · ${venue.cities.join(', ')}` : ''}
                              {venue.addresses?.[0] ? ` · ${venue.addresses[0]}` : ''}
                            </p>

                            {!!venue.possible_matches?.length && (
                              <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Possible existing match</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {venue.possible_matches.map((match) => (
                                    <span key={`${key}-${match.profile_id}`} className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">
                                      {match.display_name} · {match.confidence} · {Math.round(Number(match.score || 0) * 100)}%
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {!!venue.sample_events?.length && (
                              <div className="mt-3 grid gap-2 md:grid-cols-2">
                                {venue.sample_events.slice(0, 4).map((event) => (
                                  <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-sm">
                                    <p className="truncate font-semibold text-slate-100">{event.title || `Event #${event.id}`}</p>
                                    <p className="mt-1 text-xs text-slate-500">{formatDate(event.date)} · #{event.id}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-400">
                    No candidates match the current filters.
                  </p>
                )
              ) : (
                <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-400">
                  Run a venue scan to find missing shells.
                </p>
              )}
            </div>
          </section>

          {applyResult && (
            <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <h2 className="text-xl font-semibold text-white">Last operation</h2>
              </div>
              <pre className="mt-4 max-h-72 overflow-auto rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-300">
                {JSON.stringify(applyResult, null, 2)}
              </pre>
            </section>
          )}
        </div>
      </main>
    </>
  );
};

export default AdminVenuePhotosPage;
