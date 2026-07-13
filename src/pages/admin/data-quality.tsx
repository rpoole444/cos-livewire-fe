import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseZap,
  ExternalLink,
  Filter,
  ImagePlus,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAdminRouteGuard } from '@/hooks/useAdminRouteGuard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type DataQualitySummary = {
  total: number;
  critical: number;
  warnings: number;
  suggestions: number;
  events_missing_venue_links: number;
  events_missing_artist_links: number;
  broken_or_fallback_images: number;
  possible_duplicates: number;
  incomplete_shell_venues: number;
  pending_claims: number;
  imports_needing_attention: number;
  byIssueType?: Record<string, number>;
  bySeverity?: Record<string, number>;
};

type SuggestedFix = {
  action: string;
  label: string;
  confidence?: string;
  score?: number;
  reason?: string;
  payload?: Record<string, unknown>;
};

type DataQualityIssue = {
  id: string;
  entityType: 'event' | 'venue' | 'claim' | 'import_event' | string;
  entityId: string;
  entityName: string;
  issueType: string;
  severity: 'critical' | 'warning' | 'suggestion' | string;
  title: string;
  description?: string;
  region?: string | null;
  source?: string | null;
  importBatchId?: number | string | null;
  currentValue?: unknown;
  suggestedFixes?: SuggestedFix[];
  metadata?: Record<string, unknown>;
  lastUpdated?: string | null;
};

type IssuesResponse = {
  issues: DataQualityIssue[];
  page: number;
  pageSize: number;
  total: number;
  summary: DataQualitySummary;
};

type DuplicateEvent = {
  id: number;
  user_id?: number | null;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  venue_name?: string | null;
  venue_profile_id?: number | null;
  venue_profile_user_id?: number | null;
  venue_profile_display_name?: string | null;
  venue_profile_owner_email?: string | null;
  artist_profile_id?: number | null;
  artist_profile_display_name?: string | null;
  genre?: string | null;
  region?: string | null;
  website?: string | null;
  website_link?: string | null;
  ticket_link?: string | null;
  poster?: string | null;
  source?: string | null;
  source_label?: string | null;
  is_approved?: boolean | null;
  submitter_email?: string | null;
  submitter_first_name?: string | null;
  submitter_last_name?: string | null;
  claimed_by_user_email?: string | null;
  last_edited_by_user_email?: string | null;
};

type DuplicateComparison = {
  leftEvent: DuplicateEvent;
  rightEvent: DuplicateEvent;
  match?: {
    level?: string;
    score?: number;
    reason?: string;
  } | null;
  existingDecision?: {
    decision?: string;
    notes?: string;
  } | null;
  mergePreview?: {
    keepLeft?: Record<string, unknown>;
    keepRight?: Record<string, unknown>;
  };
};

const regionOptions = [
  { label: 'All regions', value: '' },
  { label: 'Colorado Springs', value: 'colorado-springs' },
  { label: 'Pueblo Area', value: 'pueblo-area' },
  { label: 'Southern Colorado', value: 'southern-colorado' },
  { label: 'Castle Rock', value: 'castle-rock' },
  { label: 'Denver', value: 'denver' },
  { label: 'Boulder', value: 'boulder' },
  { label: 'Fort Collins', value: 'fort-collins' },
  { label: 'Greeley', value: 'greeley' },
  { label: 'Other Front Range', value: 'other-front-range' },
];

const issueTypeLabels: Record<string, string> = {
  missing_venue_link: 'Missing venue link',
  missing_artist_link: 'Missing artist link',
  broken_image: 'Broken image',
  fallback_image: 'Fallback image',
  weak_title: 'Weak title',
  weak_description: 'Thin description',
  missing_region: 'Missing region',
  invalid_or_missing_datetime: 'Date/time issue',
  possible_duplicate: 'Possible duplicate',
  incomplete_shell_venue: 'Shell venue incomplete',
  incomplete_venue_profile: 'Venue incomplete',
  pending_claim: 'Pending claim',
  import_needs_attention: 'Import needs review',
};

const severityStyles: Record<string, string> = {
  critical: 'border-red-400/50 bg-red-500/15 text-red-100',
  warning: 'border-amber-400/50 bg-amber-500/15 text-amber-100',
  suggestion: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100',
};

const issueLabel = (value?: string) => issueTypeLabels[value || ''] || String(value || '').replace(/_/g, ' ');

const getNumericPayloadValue = (fix: SuggestedFix | undefined, key: string) => {
  const value = fix?.payload?.[key];
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getCandidateEventId = (fix: SuggestedFix | undefined) => getNumericPayloadValue(fix, 'existing_event_id');

const getStringMetadataValue = (issue: DataQualityIssue, key: string) => {
  const value = issue.metadata?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Unknown';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const displayValue = (value: unknown) => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return 'Missing';
  return String(value);
};

const displaySubmitter = (event: DuplicateEvent) => {
  const name = [event.submitter_first_name, event.submitter_last_name]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
  if (event.submitter_email && name) return `${name} <${event.submitter_email}>`;
  if (event.submitter_email) return event.submitter_email;
  if (event.user_id) return `User #${event.user_id}`;
  return 'No owner / public calendar';
};

const publicHrefForIssue = (issue: DataQualityIssue) => {
  const slug = getStringMetadataValue(issue, 'slug');
  if (!slug) return null;
  if (issue.entityType === 'event') return `/eventRouter/${slug}`;
  if (issue.entityType === 'venue') return `/artists/${slug}`;
  return null;
};

const adminHrefForIssue = (issue: DataQualityIssue) => {
  if (issue.entityType === 'event') return `/events/edit/${issue.entityId}`;
  if (issue.entityType === 'import_event' && issue.importBatchId) return `/admin/imports/${issue.importBatchId}`;
  if (issue.entityType === 'claim') return '/AdminService';
  const slug = getStringMetadataValue(issue, 'slug');
  if (issue.entityType === 'venue' && slug) return `/artists/${slug}`;
  return null;
};

const cleanQuery = (query: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params;
};

const DataQualityPage: React.FC = () => {
  const router = useRouter();
  const { isAuthorized, loading } = useAdminRouteGuard({ loginRedirect: '/admin/data-quality' });
  const [data, setData] = useState<IssuesResponse | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionStatus, setActionStatus] = useState('');
  const [duplicateComparison, setDuplicateComparison] = useState<DuplicateComparison | null>(null);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateNotes, setDuplicateNotes] = useState('');
  const [keepEventId, setKeepEventId] = useState<number | null>(null);

  const filters = useMemo(() => {
    const query = router.query;
    return {
      entityType: typeof query.entityType === 'string' ? query.entityType : '',
      issueType: typeof query.issueType === 'string' ? query.issueType : '',
      severity: typeof query.severity === 'string' ? query.severity : '',
      region: typeof query.region === 'string' ? query.region : '',
      readyToFix: typeof query.readyToFix === 'string' ? query.readyToFix : '',
      q: typeof query.q === 'string' ? query.q : '',
      sort: typeof query.sort === 'string' ? query.sort : 'severity',
      page: Number(query.page || 1),
    };
  }, [router.query]);

  const loadIssues = useCallback(async () => {
    if (!isAuthorized) return;
    setIsLoading(true);
    setError('');
    try {
      const params = cleanQuery({ ...filters, pageSize: 50 });
      const response = await fetch(`${API_BASE_URL}/api/admin/data-quality/issues?${params.toString()}`, {
        credentials: 'include',
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || 'Unable to load data-quality issues.');
      setData(body);
      setSelected(new Set());
    } catch (err) {
      console.error('Data quality load failed', err);
      setError(err instanceof Error ? err.message : 'Unable to load data-quality issues.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, isAuthorized]);

  useEffect(() => {
    if (router.isReady && isAuthorized) loadIssues();
  }, [isAuthorized, loadIssues, router.isReady]);

  const updateFilter = (patch: Record<string, string | number>) => {
    const next = {
      entityType: filters.entityType,
      issueType: filters.issueType,
      severity: filters.severity,
      region: filters.region,
      readyToFix: filters.readyToFix,
      q: filters.q,
      sort: filters.sort,
      page: 1,
      ...patch,
    };
    router.replace(
      { pathname: '/admin/data-quality', query: Object.fromEntries(cleanQuery(next)) },
      undefined,
      { shallow: true }
    );
  };

  const callAction = async (issue: DataQualityIssue, fix?: SuggestedFix) => {
    try {
      if (fix?.action === 'compare_duplicate') {
        const candidateId = getCandidateEventId(fix);
        const eventId = Number(issue.entityId);
        if (!candidateId || !Number.isFinite(eventId)) {
          setActionStatus('Unable to compare: missing duplicate event id.');
          return;
        }

        setDuplicateLoading(true);
        setActionStatus('Loading duplicate comparison...');
        const params = new URLSearchParams({
          left_event_id: String(eventId),
          right_event_id: String(candidateId),
        });
        const response = await fetch(`${API_BASE_URL}/api/admin/data-quality/duplicates/compare?${params.toString()}`, {
          credentials: 'include',
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.message || 'Unable to load duplicate comparison.');
        setDuplicateComparison(result);
        setDuplicateNotes(result?.existingDecision?.notes || '');
        setKeepEventId(result?.leftEvent?.id || eventId);
        setActionStatus('');
        return;
      }

      setActionStatus('Working...');
      let endpoint = '';
      let body: Record<string, unknown> = {};

      if (!fix || fix.action === 'mark_reviewed') {
        endpoint = `/api/admin/data-quality/events/${issue.entityId}/mark-reviewed`;
      } else if (fix.action === 'attach_venue_profile') {
        endpoint = `/api/admin/data-quality/events/${issue.entityId}/attach-venue`;
        body = { venue_profile_id: getNumericPayloadValue(fix, 'venue_profile_id') };
      } else if (fix.action === 'attach_artist_profile') {
        endpoint = `/api/admin/data-quality/events/${issue.entityId}/attach-artist`;
        body = { artist_profile_id: getNumericPayloadValue(fix, 'artist_profile_id') };
      } else if (fix.action === 'apply_venue_image') {
        endpoint = `/api/admin/data-quality/events/${issue.entityId}/apply-venue-image`;
      } else {
        setActionStatus('That fix opens a review flow instead of applying automatically.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || 'Unable to apply fix.');
      setActionStatus('Fix applied.');
      await loadIssues();
    } catch (err) {
      console.error('Data quality action failed', err);
      setActionStatus(err instanceof Error ? err.message : 'Unable to apply fix.');
    }
  };

  const saveDuplicateDecision = async (decision: 'merge' | 'reject_duplicate' | 'approve_separate') => {
    if (!duplicateComparison) return;

    const leftEventId = duplicateComparison.leftEvent?.id;
    const rightEventId = duplicateComparison.rightEvent?.id;
    if (!leftEventId || !rightEventId) {
      setActionStatus('Unable to save duplicate decision: missing event ids.');
      return;
    }

    try {
      setDuplicateLoading(true);
      setActionStatus('Saving duplicate decision...');
      const response = await fetch(`${API_BASE_URL}/api/admin/data-quality/duplicates/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          left_event_id: leftEventId,
          right_event_id: rightEventId,
          decision,
          keep_event_id: decision === 'merge' ? keepEventId : undefined,
          notes: duplicateNotes,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || 'Unable to save duplicate decision.');
      setActionStatus(
        decision === 'merge'
          ? 'Duplicate merged and decision stored.'
          : decision === 'reject_duplicate'
            ? 'Duplicate rejection stored.'
            : 'Separate-event decision stored.'
      );
      setDuplicateComparison(null);
      setDuplicateNotes('');
      setKeepEventId(null);
      await loadIssues();
    } catch (err) {
      console.error('Duplicate decision failed', err);
      setActionStatus(err instanceof Error ? err.message : 'Unable to save duplicate decision.');
    } finally {
      setDuplicateLoading(false);
    }
  };

  const bulkMarkReviewed = async () => {
    const eventIds = (data?.issues || [])
      .filter((issue) => selected.has(issue.id) && issue.entityType === 'event')
      .map((issue) => Number(issue.entityId))
      .filter(Number.isFinite);
    if (!eventIds.length) {
      setActionStatus('Select at least one event issue.');
      return;
    }

    try {
      setActionStatus('Marking selected events reviewed...');
      const response = await fetch(`${API_BASE_URL}/api/admin/data-quality/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'mark_reviewed', eventIds }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || 'Unable to run bulk action.');
      setActionStatus(`${result?.updatedCount || eventIds.length} events marked reviewed.`);
      await loadIssues();
    } catch (err) {
      console.error('Bulk data quality action failed', err);
      setActionStatus(err instanceof Error ? err.message : 'Unable to run bulk action.');
    }
  };

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          Checking admin access...
        </div>
      </div>
    );
  }

  const issues = data?.issues || [];
  const summary = data?.summary;
  const totalPages = data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1;
  const duplicateFields: Array<[string, keyof DuplicateEvent, (value: unknown) => string]> = [
    ['Title', 'title', displayValue],
    ['Uploaded by', 'submitter_email', displayValue],
    ['Uploader user id', 'user_id', displayValue],
    ['Claimed by', 'claimed_by_user_email', displayValue],
    ['Venue owner', 'venue_profile_owner_email', displayValue],
    ['Last edited by', 'last_edited_by_user_email', displayValue],
    ['Date', 'date', (value) => formatDate(typeof value === 'string' ? value : null)],
    ['Start time', 'start_time', displayValue],
    ['End time', 'end_time', displayValue],
    ['Venue', 'venue_name', displayValue],
    ['Venue profile', 'venue_profile_display_name', displayValue],
    ['Artist profile', 'artist_profile_display_name', displayValue],
    ['Region', 'region', displayValue],
    ['Genre', 'genre', displayValue],
    ['Source', 'source_label', displayValue],
    ['Ticket URL', 'ticket_link', displayValue],
    ['Website', 'website', displayValue],
    ['Poster', 'poster', displayValue],
    ['Approved', 'is_approved', displayValue],
    ['Description', 'description', displayValue],
  ];
  const selectedMergePreview = duplicateComparison && keepEventId
    ? (keepEventId === duplicateComparison.leftEvent.id
      ? duplicateComparison.mergePreview?.keepLeft
      : duplicateComparison.mergePreview?.keepRight)
    : null;
  const selectedMergeFields = selectedMergePreview
    ? Object.keys(selectedMergePreview).filter((key) => selectedMergePreview[key] !== undefined)
    : [];
  const summaryCards: Array<[string, number, Record<string, string>]> = summary ? [
    ['Total issues', summary.total, {}],
    ['Missing venue links', summary.events_missing_venue_links, { issueType: 'missing_venue_link' }],
    ['Image issues', summary.broken_or_fallback_images, { issueType: 'fallback_image' }],
    ['Possible duplicates', summary.possible_duplicates, { issueType: 'possible_duplicate' }],
  ] : [];

  return (
    <>
      <Head>
        <title>Data Quality Command Center - Alpine Groove Guide</title>
      </Head>
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/30">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                  <DatabaseZap className="h-4 w-4" />
                  Admin Command Center
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Data quality
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                  Find weak event records, missing entity links, image fallbacks, duplicate risks, shell venues, import rows, and pending claims before they weaken the public calendar.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/AdminService"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/60 hover:text-white"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin dashboard
                </Link>
                <button
                  type="button"
                  onClick={loadIssues}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh
                </button>
              </div>
            </div>
          </section>

          {summary && (
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map(([label, value, patch]) => (
                <button
                  key={String(label)}
                  type="button"
                  onClick={() => updateFilter(patch)}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:border-emerald-400/60"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{Number(value || 0)}</p>
                </button>
              ))}
            </section>
          )}

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <label className="xl:col-span-2">
                <span className="sr-only">Search</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={filters.q}
                    onChange={(event) => updateFilter({ q: event.target.value })}
                    placeholder="Search issue, event, venue..."
                    className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
                  />
                </div>
              </label>
              <select value={filters.entityType} onChange={(event) => updateFilter({ entityType: event.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                <option value="">All records</option>
                <option value="event">Events</option>
                <option value="venue">Venues</option>
                <option value="claim">Claims</option>
                <option value="import_event">Import rows</option>
              </select>
              <select value={filters.issueType} onChange={(event) => updateFilter({ issueType: event.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                <option value="">All issue types</option>
                {Object.entries(issueTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select value={filters.severity} onChange={(event) => updateFilter({ severity: event.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                <option value="">All severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="suggestion">Suggestion</option>
              </select>
              <select value={filters.region} onChange={(event) => updateFilter({ region: event.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                {regionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => updateFilter({ readyToFix: filters.readyToFix === 'true' ? '' : 'true' })}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  filters.readyToFix === 'true'
                    ? 'border-emerald-400 bg-emerald-500/15 text-emerald-100'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                Ready-to-fix only
              </button>
              <select value={filters.sort} onChange={(event) => updateFilter({ sort: event.target.value })} className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100">
                <option value="severity">Sort by severity</option>
                <option value="confidence">Sort by confidence</option>
                <option value="newest">Newest updated</option>
                <option value="oldest">Oldest updated</option>
              </select>
              <button type="button" onClick={bulkMarkReviewed} className="rounded-full border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300">
                Mark selected reviewed
              </button>
              {actionStatus && <span className="text-sm text-slate-300">{actionStatus}</span>}
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Showing {issues.length} of {data?.total || 0} issues
              </p>
              <div className="flex items-center gap-2">
                <button disabled={filters.page <= 1} onClick={() => updateFilter({ page: filters.page - 1 })} className="rounded-full border border-slate-700 px-3 py-1 text-sm disabled:opacity-40">Prev</button>
                <span className="text-sm text-slate-400">Page {filters.page} / {totalPages}</span>
                <button disabled={filters.page >= totalPages} onClick={() => updateFilter({ page: filters.page + 1 })} className="rounded-full border border-slate-700 px-3 py-1 text-sm disabled:opacity-40">Next</button>
              </div>
            </div>

            {isLoading ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-300">
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                <p className="mt-3">Scanning records...</p>
              </div>
            ) : issues.length ? (
              issues.map((issue) => {
                const publicHref = publicHrefForIssue(issue);
                const adminHref = adminHrefForIssue(issue);
                return (
                  <article key={issue.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
                    <div className="grid gap-4 lg:grid-cols-[32px_1fr_280px]">
                      <input
                        type="checkbox"
                        checked={selected.has(issue.id)}
                        onChange={(event) => {
                          const next = new Set(selected);
                          if (event.target.checked) next.add(issue.id);
                          else next.delete(issue.id);
                          setSelected(next);
                        }}
                        className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-950"
                        aria-label={`Select ${issue.entityName}`}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-widest ${severityStyles[issue.severity] || severityStyles.suggestion}`}>
                            {issue.severity}
                          </span>
                          <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-slate-300">
                            {issue.entityType}
                          </span>
                          <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300">
                            {issueLabel(issue.issueType)}
                          </span>
                          {issue.region && <span className="rounded-full border border-amber-400/40 px-2.5 py-1 text-xs font-semibold text-amber-100">{issue.region}</span>}
                        </div>
                        <h2 className="mt-3 text-xl font-semibold text-white">{issue.entityName}</h2>
                        <p className="mt-1 text-sm font-semibold text-slate-200">{issue.title}</p>
                        {issue.description && <p className="mt-2 text-sm leading-6 text-slate-400">{issue.description}</p>}
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>Record #{issue.entityId}</span>
                          {issue.source && <span>Source: {issue.source}</span>}
                          {issue.importBatchId && <span>Batch: {issue.importBatchId}</span>}
                          <span>Updated: {formatDateTime(issue.lastUpdated)}</span>
                        </div>
                        {issue.suggestedFixes?.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {issue.suggestedFixes.map((fix, index) => (
                              <button
                                key={`${fix.action}-${index}`}
                                type="button"
                                onClick={() => callAction(issue, fix)}
                                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-300"
                              >
                                {fix.action.includes('image') ? <ImagePlus className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                                {fix.label}
                                {fix.score ? ` (${Math.round(fix.score * 100)}%)` : ''}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-2 lg:items-stretch">
                        {publicHref && (
                          <Link href={publicHref} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500">
                            Public page <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}
                        {adminHref && (
                          <Link href={adminHref} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500">
                            Review record <Link2 className="h-4 w-4" />
                          </Link>
                        )}
                        {issue.entityType === 'event' && (
                          <button
                            type="button"
                            onClick={() => callAction(issue)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/40 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300"
                          >
                            Mark reviewed <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {issue.issueType === 'possible_duplicate' && (
                          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100">
                            Use Compare duplicate to merge, reject as a duplicate, or approve as a separate show with the decision stored.
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-300">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" />
                <p className="mt-3 font-semibold text-white">No issues match these filters.</p>
                <p className="mt-1 text-sm text-slate-400">Clear filters or refresh the scan.</p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-5 text-sm leading-6 text-slate-400">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-300" />
              <p>
                Quick fixes only apply high-confidence, reversible metadata updates and write audit logs. Uncertain merges and duplicate decisions should still be reviewed manually before changing public records.
              </p>
            </div>
          </section>
        </div>
        {duplicateComparison && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 px-4 py-8 backdrop-blur-sm">
            <div className="mx-auto max-w-6xl rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-2xl shadow-black/60 sm:p-6">
              <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-amber-100">
                    <AlertTriangle className="h-4 w-4" />
                    Duplicate decision
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Compare possible duplicate events</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                    Review the records side by side, then merge missing details, reject the duplicate, or approve both as separate events.
                  </p>
                  {duplicateComparison.match && (
                    <p className="mt-2 text-sm text-amber-100">
                      Match: {duplicateComparison.match.level || 'possible'} · {Math.round(Number(duplicateComparison.match.score || 0) * 100)}%
                      {duplicateComparison.match.reason ? ` · ${duplicateComparison.match.reason}` : ''}
                    </p>
                  )}
                  {duplicateComparison.existingDecision?.decision && (
                    <p className="mt-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                      Existing decision: {duplicateComparison.existingDecision.decision.replace(/_/g, ' ')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateComparison(null);
                    setDuplicateNotes('');
                    setKeepEventId(null);
                  }}
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-widest text-slate-500">
                      <th className="w-36 border-b border-slate-800 px-3 py-3">Field</th>
                      <th className="border-b border-slate-800 px-3 py-3">
                        <label className="flex items-center gap-2 text-slate-200">
                          <input
                            type="radio"
                            name="keep-event"
                            checked={keepEventId === duplicateComparison.leftEvent.id}
                            onChange={() => setKeepEventId(duplicateComparison.leftEvent.id)}
                            className="h-4 w-4"
                          />
                          Keep #{duplicateComparison.leftEvent.id}
                          <span className="hidden text-xs font-normal text-slate-500 md:inline">
                            {displaySubmitter(duplicateComparison.leftEvent)}
                          </span>
                        </label>
                      </th>
                      <th className="border-b border-slate-800 px-3 py-3">
                        <label className="flex items-center gap-2 text-slate-200">
                          <input
                            type="radio"
                            name="keep-event"
                            checked={keepEventId === duplicateComparison.rightEvent.id}
                            onChange={() => setKeepEventId(duplicateComparison.rightEvent.id)}
                            className="h-4 w-4"
                          />
                          Keep #{duplicateComparison.rightEvent.id}
                          <span className="hidden text-xs font-normal text-slate-500 md:inline">
                            {displaySubmitter(duplicateComparison.rightEvent)}
                          </span>
                        </label>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicateFields.map(([label, key, formatter]) => {
                      const left = formatter(duplicateComparison.leftEvent[key]);
                      const right = formatter(duplicateComparison.rightEvent[key]);
                      const differs = left !== right;
                      return (
                        <tr key={String(key)} className={differs ? 'bg-amber-500/[0.04]' : ''}>
                          <th className="border-b border-slate-900 px-3 py-3 align-top text-xs font-semibold uppercase tracking-widest text-slate-500">
                            {label}
                          </th>
                          <td className={`max-w-md border-b border-slate-900 px-3 py-3 align-top text-slate-200 ${left === 'Missing' ? 'text-slate-600' : ''}`}>
                            {left}
                          </td>
                          <td className={`max-w-md border-b border-slate-900 px-3 py-3 align-top text-slate-200 ${right === 'Missing' ? 'text-slate-600' : ''}`}>
                            {right}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-200">Decision notes</span>
                  <textarea
                    value={duplicateNotes}
                    onChange={(event) => setDuplicateNotes(event.target.value)}
                    rows={4}
                    placeholder="Optional context for future admins..."
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                  />
                </label>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                  <p className="font-semibold text-white">Merge preview</p>
                  {selectedMergeFields.length ? (
                    <p className="mt-2 leading-6">
                      Keeping #{keepEventId} would fill missing fields from the other event:
                      {' '}
                      <span className="text-emerald-100">{selectedMergeFields.join(', ')}</span>.
                    </p>
                  ) : (
                    <p className="mt-2 leading-6">No missing fields would be filled. Merge would only store the duplicate decision and hide the duplicate record.</p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  onClick={() => saveDuplicateDecision('approve_separate')}
                  disabled={duplicateLoading}
                  className="rounded-full border border-cyan-400/50 px-4 py-2 text-sm font-black text-cyan-100 transition hover:border-cyan-300 disabled:opacity-60"
                >
                  Approve as separate
                </button>
                <button
                  type="button"
                  onClick={() => saveDuplicateDecision('reject_duplicate')}
                  disabled={duplicateLoading}
                  className="rounded-full border border-red-400/50 px-4 py-2 text-sm font-black text-red-100 transition hover:border-red-300 disabled:opacity-60"
                >
                  Reject duplicate
                </button>
                <button
                  type="button"
                  onClick={() => saveDuplicateDecision('merge')}
                  disabled={duplicateLoading || !keepEventId}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                >
                  {duplicateLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Merge into selected
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default DataQualityPage;
