import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAdminRouteGuard } from '@/hooks/useAdminRouteGuard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

type ImportEvent = {
  id: number | string;
  date?: string | null;
  time?: string | null;
  start_time?: string | null;
  date_time?: string | null;
  start_at?: string | null;
  venue?: string | null;
  venue_name?: string | null;
  artist_display?: string | null;
  artist?: string | null;
  warnings?: string[] | string | null;
  parse_warnings?: string[] | string | null;
  raw_block?: string | null;
  status?: string | null;
  is_rejected?: boolean | null;
  is_accepted?: boolean | null;
};

type StatusTone = 'success' | 'error';

const AdminImportBatchPage = () => {
  const router = useRouter();
  const { batchId } = router.query;
  const { isAuthorized, loading } = useAdminRouteGuard();
  const batchIdValue = Array.isArray(batchId) ? batchId[0] : batchId;
  const [events, setEvents] = useState<ImportEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<StatusTone | null>(null);
  const [actionId, setActionId] = useState<number | string | null>(null);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [draft, setDraft] = useState<Partial<ImportEvent>>({});

  const apiBasePath = useMemo(() => {
    if (!batchIdValue) return null;
    return `${API_BASE_URL}/api/admin/imports/moondog/${batchIdValue}`;
  }, [batchIdValue]);

  useEffect(() => {
    if (!isAuthorized || !apiBasePath) return;

    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const res = await fetch(apiBasePath, { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || `Failed to load batch ${batchIdValue}`);
        }
        const list = Array.isArray(data) ? data : data?.import_events ?? data?.events ?? [];
        setEvents(list);
      } catch (error) {
        console.error('Failed to load import batch', error);
        setStatusMessage('Unable to load import events for this batch.');
        setStatusTone('error');
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [apiBasePath, batchIdValue, isAuthorized]);

  const getWarnings = (event: ImportEvent): string[] => {
    const warnings = event.parse_warnings ?? event.warnings ?? [];
    if (Array.isArray(warnings)) return warnings.filter(Boolean);
    if (typeof warnings === 'string') {
      return warnings
        .split('\n')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
    return [];
  };

  const getStatus = (event: ImportEvent) => {
    if (event.status) return event.status;
    if (event.is_accepted) return 'accepted';
    if (event.is_rejected) return 'rejected';
    return 'pending';
  };

  const getDateTimeLabel = (event: ImportEvent) => {
    const rawValue = event.start_at ?? event.date_time;
    if (!rawValue) return '—';
    const parsed = new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleAccept = async (event: ImportEvent) => {
    if (!apiBasePath) return;
    setActionId(event.id);
    setStatusMessage(null);
    setStatusTone(null);
    try {
      const res = await fetch(`${apiBasePath}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ import_event_id: event.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to accept event.');
      }
      setEvents((prev) =>
        prev.map((item) =>
          item.id === event.id ? { ...item, status: 'accepted', is_accepted: true } : item
        )
      );
      setStatusMessage('Event accepted.');
      setStatusTone('success');
    } catch (error) {
      console.error('Accept failed', error);
      setStatusMessage('Unable to accept this event.');
      setStatusTone('error');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (event: ImportEvent) => {
    if (!apiBasePath) return;
    setActionId(event.id);
    setStatusMessage(null);
    setStatusTone(null);
    try {
      const res = await fetch(`${apiBasePath}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ import_event_id: event.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to reject event.');
      }
      setEvents((prev) =>
        prev.map((item) =>
          item.id === event.id ? { ...item, status: 'rejected', is_rejected: true } : item
        )
      );
      setStatusMessage('Event rejected.');
      setStatusTone('success');
    } catch (error) {
      console.error('Reject failed', error);
      setStatusMessage('Unable to reject this event.');
      setStatusTone('error');
    } finally {
      setActionId(null);
    }
  };

  const startEdit = (event: ImportEvent) => {
    setEditingId(event.id);
    setDraft({
      date: event.date ?? '',
      time: event.time ?? event.start_time ?? '',
      venue: event.venue ?? event.venue_name ?? '',
      artist_display: event.artist_display ?? event.artist ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const handleUpdate = async (event: ImportEvent) => {
    if (!apiBasePath) return;
    setActionId(event.id);
    setStatusMessage(null);
    setStatusTone(null);
    try {
      const res = await fetch(`${apiBasePath}/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date: draft.date ?? event.date,
          time: draft.time ?? event.time ?? event.start_time,
          venue: draft.venue ?? event.venue ?? event.venue_name,
          artist_display: draft.artist_display ?? event.artist_display ?? event.artist,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to update event.');
      }
      setEvents((prev) =>
        prev.map((item) =>
          item.id === event.id
            ? {
                ...item,
                date: draft.date ?? item.date,
                time: draft.time ?? item.time,
                venue: draft.venue ?? item.venue,
                artist_display: draft.artist_display ?? item.artist_display,
              }
            : item
        )
      );
      setStatusMessage('Event updated.');
      setStatusTone('success');
      cancelEdit();
    } catch (error) {
      console.error('Update failed', error);
      setStatusMessage('Unable to update this event.');
      setStatusTone('error');
    } finally {
      setActionId(null);
    }
  };

  if (loading || !isAuthorized || !router.isReady) {
    return (
      <>
        <Head>
        <title>Import Batch – Alpine Groove Guide</title>
      </Head>
        <div className="min-h-screen bg-gray-950 px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin</p>
            <h1 className="mt-2 text-2xl font-semibold">Loading import batch…</h1>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Import Batch {batchIdValue ?? ''} – Alpine Groove Guide</title>
      </Head>
      <div className="min-h-screen bg-gray-950 px-6 py-12 text-slate-100">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Admin Tools</p>
            <h1 className="mt-3 text-3xl font-semibold">Import batch {batchIdValue}</h1>
            <p className="mt-2 text-sm text-slate-400">
              Track the status, errors, and imported records for this batch.
            </p>
          </header>

          <section className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Staged import events</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Review parsed records before they are committed to the live calendar.
                </p>
              </div>
              <Link
                href="/admin/import"
                className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                ← Back to import
              </Link>
            </div>

            {statusMessage && (
              <p
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  statusTone === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                }`}
              >
                {statusMessage}
              </p>
            )}

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-800/70 text-xs uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date/time</th>
                    <th className="px-4 py-3">Venue</th>
                    <th className="px-4 py-3">Artist</th>
                    <th className="px-4 py-3">Parse warnings</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {isLoadingEvents && (
                    <tr>
                      <td className="px-4 py-6 text-slate-400" colSpan={6}>
                        Loading staged events…
                      </td>
                    </tr>
                  )}
                  {!isLoadingEvents && events.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-slate-400" colSpan={6}>
                        No staged events found for this batch.
                      </td>
                    </tr>
                  )}
                  {!isLoadingEvents &&
                    events.map((event) => {
                      const warnings = getWarnings(event);
                      const status = getStatus(event);
                      const isRejected = status === 'rejected';
                      const isAccepted = status === 'accepted';
                      const isEditing = editingId === event.id;
                      const disableActions = isRejected || isAccepted || actionId === event.id;
                      const rowTone = isAccepted
                        ? 'bg-emerald-500/10'
                        : isRejected
                        ? 'bg-rose-500/10'
                        : 'bg-transparent';
                      if (process.env.NODE_ENV !== 'production') {
                        const hasTimeInRawBlock = Boolean(event.raw_block?.match(/\b\d{1,2}:\d{2}\b/));
                        const startAtInvalid = !event.start_at || Number.isNaN(new Date(event.start_at).getTime());
                        if (hasTimeInRawBlock && startAtInvalid) {
                          console.warn('[AdminImport] Invalid or missing start_at for staged event:', event);
                        }
                      }

                      return (
                        <tr key={event.id} className={`${rowTone}`}>
                          <td className="px-4 py-4 text-slate-200">
                            {isEditing ? (
                              <input
                                value={draft.date ?? ''}
                                onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
                                className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-sm text-slate-100"
                                placeholder="YYYY-MM-DD"
                              />
                            ) : (
                              <p className="font-medium">{getDateTimeLabel(event)}</p>
                            )}
                            {isEditing && (
                              <input
                                value={draft.time ?? ''}
                                onChange={(e) => setDraft((prev) => ({ ...prev, time: e.target.value }))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-sm text-slate-100"
                                placeholder="HH:MM"
                              />
                            )}
                          </td>
                          <td className="px-4 py-4 text-slate-200">
                            {isEditing ? (
                              <input
                                value={draft.venue ?? ''}
                                onChange={(e) => setDraft((prev) => ({ ...prev, venue: e.target.value }))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-sm text-slate-100"
                                placeholder="Venue"
                              />
                            ) : (
                              event.venue ?? event.venue_name ?? '—'
                            )}
                          </td>
                          <td className="px-4 py-4 text-slate-200">
                            {isEditing ? (
                              <input
                                value={draft.artist_display ?? ''}
                                onChange={(e) =>
                                  setDraft((prev) => ({ ...prev, artist_display: e.target.value }))
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-sm text-slate-100"
                                placeholder="Artist display"
                              />
                            ) : (
                              event.artist_display ?? event.artist ?? '—'
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {warnings.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {warnings.map((warning, index) => (
                                  <span
                                    key={`${event.id}-warning-${index}`}
                                    className="rounded-full border border-amber-400/60 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-200"
                                  >
                                    {warning}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">None</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                                isAccepted
                                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                                  : isRejected
                                  ? 'border-rose-500/40 bg-rose-500/15 text-rose-200'
                                  : 'border-slate-600/60 bg-slate-800/40 text-slate-300'
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleUpdate(event)}
                                    disabled={actionId === event.id}
                                    className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="rounded-full border border-slate-600 px-4 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-400"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEdit(event)}
                                    disabled={disableActions}
                                    className="rounded-full border border-slate-600 px-4 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleAccept(event)}
                                    disabled={disableActions}
                                    className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleReject(event)}
                                    disabled={disableActions}
                                    className="rounded-full bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>

          <Link
            href="/AdminService"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Review submissions
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdminImportBatchPage;
