import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import EventPoster from '@/components/EventPoster';
import { DEFAULT_REGION, MUSIC_REGIONS, getRegionLabel } from '@/constants/regions';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const IMPORT_API_BASE = `${API_BASE_URL}/api/imports`;

type ImportEvent = {
  id: number | string;
  date?: string | null;
  time?: string | null;
  start_time?: string | null;
  start_at?: string | null;
  venue?: string | null;
  venue_name?: string | null;
  artist_display?: string | null;
  artist?: string | null;
  title?: string | null;
  description?: string | null;
  website?: string | null;
  website_link?: string | null;
  poster?: string | null;
  venue_profile_image?: string | null;
  venue_profile_display_name?: string | null;
  display_image_url?: string | null;
  display_image_source?: string | null;
  event_poster_status?: string | null;
  genre?: string | null;
  age_policy?: string | null;
  parse_warnings?: string[] | string | null;
  raw_block?: string | null;
  status?: string | null;
  promoted_event_id?: number | string | null;
  artist_profile_id?: number | string | null;
  venue_profile_id?: number | string | null;
  region?: string | null;
  readiness?: {
    state?: 'ready' | 'has_warning' | 'possible_duplicate' | 'blocked' | string;
    ready?: boolean;
    canBulkAcceptWithWarnings?: boolean;
    blocking?: string[];
    advisory?: string[];
    warnings?: string[];
  };
  duplicate_candidates?: Array<{
    level: 'exact' | 'likely' | 'possible' | string;
    score?: number;
    reason?: string | null;
    event?: {
      id: number | string;
      title?: string | null;
      slug?: string | null;
      date?: string | null;
      start_time?: string | null;
      end_time?: string | null;
      venue_name?: string | null;
      location?: string | null;
      description?: string | null;
      website?: string | null;
      website_link?: string | null;
      poster?: string | null;
      display_image_url?: string | null;
      display_image_source?: string | null;
      is_approved?: boolean | null;
      source_label?: string | null;
      source?: string | null;
      artist_profile_id?: number | string | null;
      venue_profile_id?: number | string | null;
      venue_profile_display_name?: string | null;
    } | null;
  }>;
  artist_suggestions?: Array<{
    id: number | string;
    display_name: string;
    slug?: string | null;
    home_region?: string | null;
    score?: number;
  }>;
};

type BatchPayload = {
  batch?: {
    id: number;
    source: string;
    status?: string | null;
    created_at?: string | null;
  };
  canPromote?: boolean;
  events?: ImportEvent[];
};

type StatusTone = 'success' | 'error';
type BulkAction = 'accept_selected' | 'reject_selected' | 'delete_selected' | 'clear_broken_posters' | 'replace_poster' | 'apply_edits';
type ReadinessFilter = 'all' | 'ready' | 'warning' | 'blocked' | 'duplicate' | 'broken_image' | 'missing_venue';

const warningLabel = (warning: string) => {
  const labels: Record<string, string> = {
    duplicate_existing_event: 'Already on calendar',
    duplicate_existing_import: 'Already imported',
    duplicate_in_batch: 'Duplicate in this batch',
    duplicate_exact: 'Exact duplicate',
    duplicate_likely: 'Likely duplicate',
    duplicate_possible: 'Possible duplicate',
    multiple_artists: 'Multiple artists',
    multiple_times: 'Multiple times',
    artist_missing: 'Artist missing',
  };
  return labels[warning] || warning;
};

const getWarnings = (event: ImportEvent): string[] => {
  const value = event.parse_warnings || [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // Fall through to newline split.
  }
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
};

const getStatus = (event: ImportEvent) => event.status || 'pending';

const readinessLabel = (key: string) => {
  const labels: Record<string, string> = {
    missing_title: 'Missing title',
    missing_date: 'Missing date',
    missing_start_time: 'Missing start time',
    missing_venue: 'Missing venue',
    missing_region: 'Missing region',
    missing_location_data: 'Missing location details',
    missing_artist: 'Missing artist',
    broken_image_url: 'Broken image URL',
    invalid_website_url: 'Invalid website URL',
    invalid_ticket_url: 'Invalid ticket URL',
    possible_duplicate: 'Possible duplicate',
  };
  return labels[key] || key.replace(/_/g, ' ');
};

const getReadiness = (event: ImportEvent) => {
  const state = event.readiness?.state || 'ready';
  const warnings = getWarnings(event);
  const duplicateWarning = warnings.some((warning) => warning.startsWith('duplicate_')) || Boolean(event.duplicate_candidates?.length);
  const blocking = event.readiness?.blocking || [];
  const advisory = [...(event.readiness?.advisory || [])];
  if (duplicateWarning && !advisory.includes('possible_duplicate')) advisory.push('possible_duplicate');
  return {
    state: blocking.length ? 'blocked' : duplicateWarning ? 'possible_duplicate' : advisory.length ? 'has_warning' : state,
    blocking,
    advisory,
    ready: blocking.length === 0 && !duplicateWarning && advisory.length === 0,
    canBulkAcceptWithWarnings: blocking.length === 0,
  };
};

const hasBrokenPoster = (event: ImportEvent) => getReadiness(event).blocking.includes('broken_image_url');

const imageSourceLabel = (event: ImportEvent) => {
  if (event.display_image_source === 'event_poster') return 'Event poster';
  if (event.display_image_source === 'venue_profile_image') return 'Using venue photo';
  if (event.display_image_source === 'source_image') return 'Using source image';
  if (event.display_image_source === 'default') return 'Using Alpine default';
  return null;
};

const formatDateTime = (event: ImportEvent) => {
  if (event.date && event.start_time) {
    return `${event.date} ${event.start_time.slice(0, 5)}`;
  }
  if (!event.start_at) return '-';
  const date = new Date(event.start_at);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const AdminImportBatchPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const batchId = Array.isArray(router.query.batchId) ? router.query.batchId[0] : router.query.batchId;
  const source = Array.isArray(router.query.source) ? router.query.source[0] : router.query.source || 'moondog';
  const [events, setEvents] = useState<ImportEvent[]>([]);
  const [canPromote, setCanPromote] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<StatusTone | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [draft, setDraft] = useState<Partial<ImportEvent>>({});
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'date' | 'venue' | 'status' | 'readiness'>('date');
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDraft, setBulkDraft] = useState<Record<string, string | boolean>>({
    venue_name: '',
    region: '',
    age_policy: '',
    website: '',
    website_link: '',
    poster: '',
    genre: '',
    artist_profile_id: '',
    venue_profile_id: '',
    clear_poster: false,
  });
  const [compareTarget, setCompareTarget] = useState<{
    staged: ImportEvent;
    candidate: NonNullable<ImportEvent['duplicate_candidates']>[number];
  } | null>(null);

  const apiBasePath = useMemo(() => {
    if (!batchId || !source) return null;
    return `${IMPORT_API_BASE}/${source}/${batchId}`;
  }, [batchId, source]);

  useEffect(() => {
    if (!router.isReady || loading) return;
    if (!user) {
      router.replace(`/LoginPage?redirect=${encodeURIComponent(router.asPath)}`);
    }
  }, [loading, router, user]);

  const loadBatch = async () => {
    if (!apiBasePath) return;
    setIsLoadingEvents(true);
    try {
      const res = await fetch(apiBasePath, { credentials: 'include' });
      const data: BatchPayload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as any)?.message || 'Failed to load import batch.');
      }
      setEvents(Array.isArray(data.events) ? data.events : []);
      setCanPromote(Boolean(data.canPromote));
    } catch (error) {
      console.error('Failed to load import batch', error);
      setStatusMessage('Unable to load this import batch.');
      setStatusTone('error');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (!user || !apiBasePath) return;
    loadBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBasePath, user]);

  const updateEventInState = (updated: ImportEvent) => {
    setEvents((prev) => prev.map((event) => (String(event.id) === String(updated.id) ? { ...event, ...updated } : event)));
  };

  const acceptOrReject = async (event: ImportEvent, nextAction: 'accept' | 'reject') => {
    setActionKey(`${nextAction}-${event.id}`);
    setStatusMessage(null);
    setStatusTone(null);
    try {
      const res = await fetch(`${IMPORT_API_BASE}/${source}/events/${event.id}/${nextAction}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || `Unable to ${nextAction} row.`);
      }
      updateEventInState(data);
      setStatusMessage(nextAction === 'accept' ? 'Row accepted for admin review.' : 'Row rejected.');
      setStatusTone('success');
    } catch (error) {
      console.error('Import row action failed', error);
      setStatusMessage(nextAction === 'accept' ? 'Unable to accept this row.' : 'Unable to reject this row.');
      setStatusTone('error');
    } finally {
      setActionKey(null);
    }
  };

  const startEdit = (event: ImportEvent) => {
    setEditingId(event.id);
    setDraft({
      date: event.date || '',
      time: event.start_time || event.time || '',
      venue: event.venue || event.venue_name || '',
      artist_display: event.artist_display || event.artist || '',
      title: event.title || '',
      description: event.description || '',
      website: event.website || '',
      website_link: event.website_link || '',
      poster: event.poster || '',
      genre: event.genre || '',
      age_policy: event.age_policy || '',
      artist_profile_id: event.artist_profile_id || '',
      venue_profile_id: event.venue_profile_id || '',
    });
  };

  const patchImportEvent = async (
    event: ImportEvent,
    payload: Record<string, unknown>,
    successMessage = 'Row updated.',
  ) => {
    if (!apiBasePath) return;
    setActionKey(`save-${event.id}`);
    setStatusMessage(null);
    setStatusTone(null);
    try {
      const res = await fetch(`${apiBasePath}/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Unable to update row.');
      }
      updateEventInState(data);
      setEditingId(null);
      setDraft({});
      setStatusMessage(successMessage);
      setStatusTone('success');
    } catch (error) {
      console.error('Import row update failed', error);
      setStatusMessage('Unable to save this row.');
      setStatusTone('error');
    } finally {
      setActionKey(null);
    }
  };

  const saveEdit = async (event: ImportEvent) => {
    await patchImportEvent(event, {
      date: draft.date,
      time: draft.time,
      venue: draft.venue,
      artist_display: draft.artist_display,
      title: draft.title,
      description: draft.description,
      website: draft.website,
      website_link: draft.website_link,
      poster: draft.poster,
      genre: draft.genre,
      age_policy: draft.age_policy,
      artist_profile_id: draft.artist_profile_id,
      venue_profile_id: draft.venue_profile_id,
    });
  };

  const attachArtistSuggestion = async (event: ImportEvent, artistId: number | string) => {
    await patchImportEvent(event, { artist_profile_id: artistId }, 'Artist profile attached to staged row.');
  };

  const openExistingEventEditor = (candidate: NonNullable<ImportEvent['duplicate_candidates']>[number]) => {
    const existingId = candidate.event?.id;
    if (!existingId || typeof window === 'undefined') return;
    window.open(`/events/edit/${existingId}`, '_blank', 'noopener,noreferrer');
  };

  const promoteBatch = async () => {
    setActionKey('promote');
    setStatusMessage(null);
    setStatusTone(null);
    try {
      const res = await fetch(`${IMPORT_API_BASE}/${source}/${batchId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Unable to move batch to review.');
      }
      setStatusMessage(`Moved ${data?.promoted_count || 0} event${data?.promoted_count === 1 ? '' : 's'} to normal admin review.`);
      setStatusTone('success');
      await loadBatch();
    } catch (error) {
      console.error('Import promotion failed', error);
      setStatusMessage('Unable to move this batch to admin review.');
      setStatusTone('error');
    } finally {
      setActionKey(null);
    }
  };

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return [...events]
      .filter((event) => {
        const status = getStatus(event);
        const readiness = getReadiness(event);
        if (statusFilter !== 'all' && status !== statusFilter) return false;
        if (readinessFilter === 'ready' && !readiness.ready) return false;
        if (readinessFilter === 'warning' && !['has_warning', 'possible_duplicate'].includes(readiness.state)) return false;
        if (readinessFilter === 'blocked' && readiness.state !== 'blocked') return false;
        if (readinessFilter === 'duplicate' && !readiness.advisory.includes('possible_duplicate')) return false;
        if (readinessFilter === 'broken_image' && !hasBrokenPoster(event)) return false;
        if (readinessFilter === 'missing_venue' && !readiness.blocking.includes('missing_venue')) return false;
        if (!term) return true;
        return [
          event.title,
          event.artist_display,
          event.artist,
          event.venue_name,
          event.venue,
          event.description,
          event.region,
        ].filter(Boolean).join(' ').toLowerCase().includes(term);
      })
      .sort((a, b) => {
        if (sortKey === 'venue') return String(a.venue_name || a.venue || '').localeCompare(String(b.venue_name || b.venue || ''));
        if (sortKey === 'status') return getStatus(a).localeCompare(getStatus(b));
        if (sortKey === 'readiness') return getReadiness(a).state.localeCompare(getReadiness(b).state);
        return String(a.date || a.start_at || '').localeCompare(String(b.date || b.start_at || '')) ||
          String(a.start_time || a.time || '').localeCompare(String(b.start_time || b.time || ''));
      });
  }, [events, readinessFilter, searchTerm, sortKey, statusFilter]);

  const selectedEvents = useMemo(
    () => events.filter((event) => selectedIds.some((id) => String(id) === String(event.id))),
    [events, selectedIds],
  );

  const selectedSummary = useMemo(() => {
    return selectedEvents.reduce(
      (summary, event) => {
        const readiness = getReadiness(event);
        if (readiness.ready) summary.ready += 1;
        if (readiness.state === 'blocked') summary.blocked += 1;
        if (['has_warning', 'possible_duplicate'].includes(readiness.state)) summary.warning += 1;
        if (readiness.advisory.includes('possible_duplicate')) summary.duplicates += 1;
        if (hasBrokenPoster(event)) summary.brokenImages += 1;
        return summary;
      },
      { ready: 0, warning: 0, blocked: 0, duplicates: 0, brokenImages: 0 },
    );
  }, [selectedEvents]);

  const visibleIds = filteredEvents.map((event) => event.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.some((selectedId) => String(selectedId) === String(id)));

  const toggleSelected = (id: number | string) => {
    setSelectedIds((prev) =>
      prev.some((selectedId) => String(selectedId) === String(id))
        ? prev.filter((selectedId) => String(selectedId) !== String(id))
        : [...prev, id],
    );
  };

  const toggleVisibleSelection = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !visibleIds.some((visibleId) => String(visibleId) === String(id)));
      }
      const next = [...prev];
      visibleIds.forEach((id) => {
        if (!next.some((selectedId) => String(selectedId) === String(id))) next.push(id);
      });
      return next;
    });
  };

  const bulkAction = async (action: BulkAction, options: Record<string, unknown> = {}) => {
    if (!apiBasePath || selectedIds.length === 0) return;
    if (action === 'accept_selected') {
      if (selectedSummary.blocked > 0) {
        setStatusMessage('Bulk accept is blocked until selected rows have required fields and safe images.');
        setStatusTone('error');
        return;
      }
      if (selectedSummary.warning > 0 && !window.confirm(`Accept ${selectedIds.length} selected rows with ${selectedSummary.warning} warning(s)?`)) return;
    }
    if (action === 'reject_selected' && !window.confirm(`Reject ${selectedIds.length} selected row(s)?`)) return;
    if (action === 'delete_selected' && !window.confirm(`Delete ${selectedIds.length} staged row(s)? This removes them from the batch.`)) return;

    setActionKey(`bulk-${action}`);
    setStatusMessage(null);
    setStatusTone(null);
    try {
      const res = await fetch(`${apiBasePath}/events/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          eventIds: selectedIds,
          allowWarnings: selectedSummary.warning > 0,
          confirm: action === 'delete_selected',
          ...options,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Bulk action failed.');

      if (Array.isArray(data.deletedIds) && data.deletedIds.length) {
        setEvents((prev) => prev.filter((event) => !data.deletedIds.some((id: number | string) => String(id) === String(event.id))));
        setSelectedIds([]);
      } else if (Array.isArray(data.events)) {
        setEvents((prev) => prev.map((event) => {
          const updated = data.events.find((item: ImportEvent) => String(item.id) === String(event.id));
          return updated ? { ...event, ...updated } : event;
        }));
      }

      setStatusMessage(`Bulk action complete: ${data.updatedCount || 0} updated${data.deletedCount ? `, ${data.deletedCount} deleted` : ''}.`);
      setStatusTone('success');
      if (action !== 'delete_selected') setSelectedIds((prev) => prev.filter((id) => !selectedEvents.some((event) => String(event.id) === String(id))));
      if (action === 'apply_edits') setBulkEditOpen(false);
    } catch (error) {
      console.error('Bulk import action failed', error);
      setStatusMessage(error instanceof Error ? error.message : 'Bulk action failed.');
      setStatusTone('error');
    } finally {
      setActionKey(null);
    }
  };

  const applyBulkEdits = () => {
    const edits = Object.fromEntries(
      Object.entries(bulkDraft).filter(([, value]) => (
        typeof value === 'boolean' ? value === true : String(value || '').trim() !== ''
      )),
    );
    bulkAction('apply_edits', { edits });
  };

  const pendingCount = events.filter((event) => getStatus(event) === 'pending').length;
  const acceptedCount = events.filter((event) => getStatus(event) === 'accepted' && !event.promoted_event_id).length;
  const promotedCount = events.filter((event) => event.promoted_event_id).length;

  if (loading || !user || !router.isReady) {
    return (
      <>
        <Head>
          <title>Import Batch – Alpine Groove Guide</title>
        </Head>
        <div className="min-h-screen bg-gray-950 px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Import</p>
            <h1 className="mt-2 text-2xl font-semibold">Loading import batch...</h1>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Import Batch {batchId || ''} – Alpine Groove Guide</title>
      </Head>
      <div className="min-h-screen bg-gray-950 px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
              {canPromote ? 'Admin Import Review' : 'Profile Import Review'}
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Import batch {batchId}</h1>
            <p className="mt-2 text-sm text-slate-400">
              Source: <span className="capitalize text-slate-200">{source}</span>. Accept clean rows here. Admins then move accepted rows into normal event review before anything appears publicly.
            </p>
          </header>

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

          <section className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Staged rows</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Pending: {pendingCount} • Accepted for review: {acceptedCount} • Already moved: {promotedCount}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canPromote && acceptedCount > 0 && (
                  <button
                    type="button"
                    onClick={promoteBatch}
                    disabled={actionKey === 'promote'}
                    className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionKey === 'promote' ? 'Moving...' : 'Move accepted to admin review'}
                  </button>
                )}
                <Link
                  href="/admin/import"
                  className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Back to import
                </Link>
              </div>
            </div>

            {!canPromote && acceptedCount > 0 && (
              <p className="mt-5 rounded-2xl border border-sun-gold/30 bg-sun-gold/10 px-4 py-3 text-sm text-slate-200">
                Your accepted rows are ready for admin review. An admin will move them into the normal event review queue, then approve them for the public calendar.
              </p>
            )}

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_180px_160px]">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Search
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search title, venue, artist..."
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Readiness
                  <select
                    value={readinessFilter}
                    onChange={(event) => setReadinessFilter(event.target.value as ReadinessFilter)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                  >
                    <option value="all">All rows</option>
                    <option value="ready">Ready</option>
                    <option value="warning">Needs review</option>
                    <option value="blocked">Blocked</option>
                    <option value="duplicate">Duplicates</option>
                    <option value="broken_image">Broken image</option>
                    <option value="missing_venue">Missing venue</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Sort
                  <select
                    value={sortKey}
                    onChange={(event) => setSortKey(event.target.value as typeof sortKey)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                  >
                    <option value="date">Date/time</option>
                    <option value="venue">Venue</option>
                    <option value="status">Status</option>
                    <option value="readiness">Readiness</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleVisibleSelection}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-950"
                  />
                  Select visible rows ({filteredEvents.length})
                </label>
                <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                  <span>{selectedIds.length} selected</span>
                  <span>{selectedSummary.ready} ready</span>
                  <span>{selectedSummary.warning} need review</span>
                  <span>{selectedSummary.blocked} blocked</span>
                  <span>{selectedSummary.brokenImages} broken image</span>
                </div>
              </div>

              {selectedIds.length > 0 && (
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => bulkAction('accept_selected')}
                      disabled={Boolean(actionKey) || selectedSummary.blocked > 0}
                      className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Bulk accept selected
                    </button>
                    <button
                      type="button"
                      onClick={() => bulkAction('reject_selected')}
                      disabled={Boolean(actionKey)}
                      className="rounded-full bg-rose-500 px-4 py-2 text-xs font-black text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Bulk reject selected
                    </button>
                    <button
                      type="button"
                      onClick={() => bulkAction('delete_selected')}
                      disabled={Boolean(actionKey)}
                      className="rounded-full border border-rose-400/50 px-4 py-2 text-xs font-black text-rose-100 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete selected
                    </button>
                    <button
                      type="button"
                      onClick={() => bulkAction('clear_broken_posters')}
                      disabled={Boolean(actionKey) || selectedSummary.brokenImages === 0}
                      className="rounded-full border border-amber-300/50 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Clear broken posters
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkEditOpen((value) => !value)}
                      className="rounded-full border border-cyan-300/50 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-500/10"
                    >
                      Bulk edit shared fields
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500"
                    >
                      Clear selection
                    </button>
                  </div>
                  {selectedSummary.blocked > 0 && (
                    <p className="mt-3 text-sm text-rose-200">
                      Bulk accept is disabled because at least one selected row is blocked. Filter by “Blocked” to fix required fields or broken image URLs.
                    </p>
                  )}

                  {bulkEditOpen && (
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                      <p className="text-sm font-semibold text-slate-100">Apply only shared fields that should be the same on every selected row.</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Venue
                          <input value={String(bulkDraft.venue_name || '')} onChange={(event) => setBulkDraft((prev) => ({ ...prev, venue_name: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100" />
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Region
                          <select value={String(bulkDraft.region || '')} onChange={(event) => setBulkDraft((prev) => ({ ...prev, region: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100">
                            <option value="">Leave unchanged</option>
                            <option value={DEFAULT_REGION}>{getRegionLabel(DEFAULT_REGION)}</option>
                            {MUSIC_REGIONS.filter((region) => region.slug !== DEFAULT_REGION).map((region) => (
                              <option key={region.slug} value={region.slug}>{region.label}</option>
                            ))}
                          </select>
                        </label>
                        {[
                          ['age_policy', 'Age policy'],
                          ['website_link', 'Ticket / RSVP link'],
                          ['website', 'Website'],
                          ['poster', 'Poster URL'],
                          ['genre', 'Genre / tags'],
                          ['artist_profile_id', 'Artist profile ID'],
                          ['venue_profile_id', 'Venue profile ID'],
                        ].map(([field, label]) => (
                          <label key={field} className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {label}
                            <input value={String(bulkDraft[field] || '')} onChange={(event) => setBulkDraft((prev) => ({ ...prev, [field]: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100" />
                          </label>
                        ))}
                      </div>
                      <label className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(bulkDraft.clear_poster)}
                          onChange={(event) => setBulkDraft((prev) => ({ ...prev, clear_poster: event.target.checked }))}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-950"
                        />
                        Clear poster URL on selected rows so venue/source/default fallback can be used.
                      </label>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={applyBulkEdits} disabled={Boolean(actionKey)} className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50">
                          Apply bulk edit to {selectedIds.length} rows
                        </button>
                        {String(bulkDraft.poster || '').trim() && (
                          <button type="button" onClick={() => bulkAction('replace_poster', { edits: { poster: bulkDraft.poster } })} disabled={Boolean(actionKey)} className="rounded-full border border-cyan-300/50 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50">
                            Replace poster only
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {isLoadingEvents && (
                <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                  Loading staged events...
                </p>
              )}

              {!isLoadingEvents && events.length === 0 && (
                <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                  No staged rows found for this batch.
                </p>
              )}

              {filteredEvents.map((event) => {
                const warnings = getWarnings(event);
                const status = getStatus(event);
                const isEditing = String(editingId) === String(event.id);
                const disabled = actionKey?.endsWith(`-${event.id}`) || Boolean(event.promoted_event_id);
                const readiness = getReadiness(event);
                const isSelected = selectedIds.some((id) => String(id) === String(event.id));

                return (
                  <article key={event.id} className={`rounded-2xl border bg-slate-950/70 p-5 ${isSelected ? 'border-emerald-400/60' : readiness.state === 'blocked' ? 'border-rose-400/50' : readiness.state === 'possible_duplicate' ? 'border-amber-400/50' : 'border-slate-800'}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:block">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelected(event.id)}
                          disabled={Boolean(event.promoted_event_id)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-950"
                        />
                        <span className="lg:sr-only">Select row</span>
                      </label>
                      <div className="w-full shrink-0 lg:w-36">
                        <EventPoster
                          posterUrl={event.display_image_url || event.poster}
                          title={event.title || event.artist_display || 'Imported event'}
                          variant="square"
                          fit={event.display_image_source === 'event_poster' ? 'cover' : 'contain'}
                          className="w-full"
                        />
                        {imageSourceLabel(event) && (
                          <p className="mt-2 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-center text-[11px] font-semibold text-slate-300">
                            {imageSourceLabel(event)}
                          </p>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                            {status}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                            readiness.state === 'blocked'
                              ? 'border-rose-400/50 bg-rose-500/10 text-rose-200'
                              : readiness.state === 'possible_duplicate'
                                ? 'border-amber-400/50 bg-amber-500/10 text-amber-200'
                                : readiness.state === 'has_warning'
                                  ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-200'
                                  : 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
                          }`}>
                            {readiness.state === 'blocked'
                              ? 'Blocked'
                              : readiness.state === 'possible_duplicate'
                                ? 'Possible duplicate'
                                : readiness.state === 'has_warning'
                                  ? 'Needs review'
                                  : 'Ready'}
                          </span>
                          {event.promoted_event_id && (
                            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                              Moved to review #{event.promoted_event_id}
                            </span>
                          )}
                          {warnings.map((warning) => (
                            <span key={`${event.id}-${warning}`} className="rounded-full border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                              {warningLabel(warning)}
                            </span>
                          ))}
                          {[...readiness.blocking, ...readiness.advisory].slice(0, 4).map((item) => (
                            <span key={`${event.id}-ready-${item}`} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                              {readinessLabel(item)}
                            </span>
                          ))}
                        </div>

                        {isEditing ? (
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {[
                              ['date', 'Date'],
                              ['time', 'Start time'],
                              ['venue', 'Venue'],
                              ['artist_display', 'Artist'],
                              ['title', 'Event title'],
                              ['website_link', 'Ticket / RSVP link'],
                              ['website', 'Website'],
                              ['poster', 'Poster URL'],
                              ['genre', 'Genre / tags'],
                              ['age_policy', 'Age policy'],
                              ['artist_profile_id', 'Artist profile ID'],
                              ['venue_profile_id', 'Venue profile ID'],
                            ].map(([field, label]) => (
                              <label key={field} className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                {label}
                                <input
                                  value={String(draft[field as keyof ImportEvent] || '')}
                                  onChange={(e) => setDraft((prev) => ({ ...prev, [field]: e.target.value }))}
                                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                                />
                              </label>
                            ))}
                            <label className="md:col-span-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Description
                              <textarea
                                value={String(draft.description || '')}
                                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-slate-100"
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <p className="text-sm text-slate-400">{formatDateTime(event)}</p>
                            <h3 className="mt-1 text-xl font-semibold text-slate-100">
                              {event.title || event.artist_display || event.artist || 'Untitled event'}
                            </h3>
                            <p className="mt-1 text-sm text-slate-300">
                              {event.venue_name || event.venue || 'Venue TBA'}
                              {event.artist_display || event.artist ? ` • ${event.artist_display || event.artist}` : ''}
                            </p>
                            {event.description && <p className="mt-3 text-sm text-slate-400">{event.description}</p>}
                            {Boolean(event.duplicate_candidates?.length || event.artist_suggestions?.length) && (
                              <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3">
                                <div className="flex flex-col gap-4 xl:flex-row">
                                  {Boolean(event.duplicate_candidates?.length) && (
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                                        Duplicate candidates
                                      </p>
                                      <div className="mt-2 space-y-2">
                                        {event.duplicate_candidates!.slice(0, 3).map((candidate) => (
                                          <div
                                            key={`${event.id}-${candidate.event?.id}-${candidate.level}`}
                                            className="rounded-xl border border-amber-400/25 bg-slate-950/70 p-3 text-xs text-slate-300"
                                          >
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="rounded-full border border-amber-300/50 px-2 py-0.5 font-semibold uppercase text-amber-100">
                                                {candidate.level === 'exact'
                                                  ? 'High confidence duplicate'
                                                  : candidate.level === 'likely'
                                                    ? 'Likely duplicate'
                                                    : 'Possible duplicate'}
                                              </span>
                                              {candidate.score !== undefined && (
                                                <span className="text-slate-500">
                                                  {Math.round(Number(candidate.score) * 100)}% match
                                                </span>
                                              )}
                                            </div>
                                            <p className="mt-2 font-semibold text-slate-100">
                                              {candidate.event?.title || 'Existing event'}
                                            </p>
                                            <p className="mt-1 text-slate-400">
                                              {[candidate.event?.date, candidate.event?.start_time?.slice(0, 5), candidate.event?.venue_name || candidate.event?.location]
                                                .filter(Boolean)
                                                .join(' • ')}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                              {candidate.event?.slug && (
                                                <Link
                                                  href={`/eventRouter/${candidate.event.slug}`}
                                                  target="_blank"
                                                  className="font-semibold text-amber-100 underline-offset-4 hover:underline"
                                                >
                                                  View existing
                                                </Link>
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => setCompareTarget({ staged: event, candidate })}
                                                className="font-semibold text-cyan-100 underline-offset-4 hover:underline"
                                              >
                                                Compare
                                              </button>
                                              {status !== 'rejected' && (
                                                <button
                                                  type="button"
                                                  onClick={() => acceptOrReject(event, 'reject')}
                                                  disabled={disabled}
                                                  className="font-semibold text-rose-200 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                  Reject staged duplicate
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {Boolean(event.artist_suggestions?.length) && (
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                                        Likely artist matches
                                      </p>
                                      <div className="mt-2 space-y-2">
                                        {event.artist_suggestions!.map((artist) => (
                                          <div
                                            key={`${event.id}-artist-${artist.id}`}
                                            className="rounded-xl border border-cyan-400/25 bg-slate-950/70 p-3 text-xs text-slate-300"
                                          >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                              <div>
                                                <p className="font-semibold text-slate-100">{artist.display_name}</p>
                                                <p className="text-slate-500">
                                                  Profile #{artist.id}
                                                  {artist.score !== undefined ? ` • ${Math.round(Number(artist.score) * 100)}% match` : ''}
                                                </p>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => attachArtistSuggestion(event, artist.id)}
                                                disabled={disabled || String(event.artist_profile_id || '') === String(artist.id)}
                                                className="rounded-full border border-cyan-300/60 px-3 py-1 font-semibold text-cyan-100 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                                              >
                                                {String(event.artist_profile_id || '') === String(artist.id) ? 'Attached' : 'Attach'}
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Matching signals</p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                {event.venue_profile_display_name && (
                                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-200">
                                    Venue match: {event.venue_profile_display_name}
                                  </span>
                                )}
                                {event.artist_profile_id && (
                                  <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-1 font-semibold text-cyan-200">
                                    Artist profile #{event.artist_profile_id}
                                  </span>
                                )}
                                {event.venue_profile_id && (
                                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-200">
                                    Venue profile #{event.venue_profile_id}
                                  </span>
                                )}
                                {imageSourceLabel(event) && (
                                  <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 font-semibold text-slate-300">
                                    {imageSourceLabel(event)}
                                  </span>
                                )}
                                {event.website_link && <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-slate-300">Ticket link present</span>}
                                {event.poster && <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-slate-300">Poster URL present</span>}
                                {!event.venue_profile_display_name && !event.artist_profile_id && !event.venue_profile_id && !imageSourceLabel(event) && (
                                  <span className="text-slate-500">No profile match yet. Edit this row or accept it as an unclaimed public listing.</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEdit(event)}
                              disabled={disabled}
                              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setDraft({});
                              }}
                              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(event)}
                              disabled={disabled}
                              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Edit
                            </button>
                            {status !== 'accepted' && (
                              <button
                                type="button"
                                onClick={() => acceptOrReject(event, 'accept')}
                                disabled={disabled}
                                className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Accept
                              </button>
                            )}
                            {status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => acceptOrReject(event, 'reject')}
                                disabled={disabled}
                                className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Reject
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {compareTarget && (
            <section className="rounded-3xl border border-amber-400/40 bg-amber-500/10 p-6 shadow-2xl shadow-black/30">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-200">Compare duplicate</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Staged row vs. existing event</h2>
                  <p className="mt-2 text-sm text-amber-50/80">
                    Review the fields before deciding whether this is a new event or a duplicate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCompareTarget(null)}
                  className="rounded-full border border-amber-200/40 px-4 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-300/10"
                >
                  Skip for later
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {[
                  {
                    label: 'Staged import row',
                    event: compareTarget.staged,
                    image: compareTarget.staged.display_image_url || compareTarget.staged.poster,
                    status: compareTarget.staged.status || 'pending',
                  },
                  {
                    label: 'Existing calendar event',
                    event: compareTarget.candidate.event || {},
                    image: compareTarget.candidate.event?.display_image_url || compareTarget.candidate.event?.poster,
                    status: compareTarget.candidate.event?.is_approved ? 'approved/live' : 'not approved',
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                      <EventPoster
                        posterUrl={item.image}
                        title={(item.event as any).title || (item.event as any).artist_display || 'Event'}
                        variant="square"
                        fit={(item.event as any).display_image_source === 'event_poster' ? 'cover' : 'contain'}
                        className="w-full"
                      />
                      <dl className="space-y-2 text-sm">
                        {[
                          ['Event title', (item.event as any).title || (item.event as any).artist_display || '-'],
                          ['Date', (item.event as any).date || '-'],
                          ['Start time', ((item.event as any).start_time || (item.event as any).time || '').slice(0, 5) || '-'],
                          ['Venue', (item.event as any).venue_profile_display_name || (item.event as any).venue_name || (item.event as any).venue || (item.event as any).location || '-'],
                          ['Artist(s)', (item.event as any).artist_display || (item.event as any).artist || (item.event as any).artist_profile_id || '-'],
                          ['Source', (item.event as any).source_label || (item.event as any).source || '-'],
                          ['Ticket URL', (item.event as any).website_link || '-'],
                          ['Website', (item.event as any).website || '-'],
                          ['Status', item.status],
                        ].map(([field, value]) => (
                          <div key={`${item.label}-${field}`}>
                            <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{field}</dt>
                            <dd className="mt-0.5 break-words text-slate-200">{String(value || '-')}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Description</p>
                      <p className="mt-1 line-clamp-5 whitespace-pre-line text-sm text-slate-300">
                        {(item.event as any).description || 'No description.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => acceptOrReject(compareTarget.staged, 'accept')}
                  disabled={actionKey === `accept-${compareTarget.staged.id}` || Boolean(compareTarget.staged.promoted_event_id)}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Approve as new event
                </button>
                <button
                  type="button"
                  onClick={() => openExistingEventEditor(compareTarget.candidate)}
                  className="rounded-full border border-cyan-300/60 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/10"
                >
                  Merge by editing existing event
                </button>
                <button
                  type="button"
                  onClick={() => acceptOrReject(compareTarget.staged, 'reject')}
                  disabled={actionKey === `reject-${compareTarget.staged.id}` || Boolean(compareTarget.staged.promoted_event_id)}
                  className="rounded-full bg-rose-500 px-4 py-2 text-sm font-black text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reject staged duplicate
                </button>
                <button
                  type="button"
                  onClick={() => setCompareTarget(null)}
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
                >
                  Skip for later
                </button>
              </div>
            </section>
          )}

          <Link
            href={canPromote ? '/AdminService' : '/UserProfile'}
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            {canPromote ? 'Review submissions' : 'Back to profile'}
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdminImportBatchPage;
