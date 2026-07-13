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
                            Compare before approving. Duplicate merge/reject still happens in the import or event review flow.
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
      </main>
    </>
  );
};

export default DataQualityPage;
