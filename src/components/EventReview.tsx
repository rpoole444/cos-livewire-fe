"use client";
import { getEventsForReview, updateEventStatus, bulkUpdateEventStatus, updateEventDetails, deleteEvent } from "@/pages/api/route";
import { useState, useEffect } from "react";
import "../styles/globals.css";
import AdminEventCard from "./AdminEventCard";
import { Event, Events } from "../interfaces/interfaces";

interface EventReviewProps {
  onCountChange?: (count: number) => void;
}

const EventReview: React.FC<EventReviewProps> = ({ onCountChange }) => {
  const [events, setEvents] = useState<Events>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkActionKey, setBulkActionKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const eventsData = await getEventsForReview();
        setEvents(eventsData);
        onCountChange?.(eventsData.length);
      } catch (error) {
        console.error('Failed to load events for review', error);
        setErrorMessage('Unable to load pending events. Please refresh or try again in a moment.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [onCountChange]);

  const handleApprove = async (eventId: number) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      await updateEventStatus(eventId, true);
      setEvents(prev => {
        const next = prev.filter(event => event.id !== eventId);
        onCountChange?.(next.length);
        return next;
      });
    } catch (err) {
      console.error("Error approving event:", err);
      setErrorMessage('Unable to approve that event.');
    }
  };

  const handleDeny = async (eventId: number) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      const adminNotes = window.prompt(
        'Optional: add a short note for the submitter about why this event was not approved.',
        ''
      );
      await deleteEvent(eventId, {
        adminNotes: adminNotes || undefined,
        notifySubmitter: true,
      });
      setEvents(prev => {
        const next = prev.filter(event => event.id !== eventId);
        onCountChange?.(next.length);
        return next;
      });
    } catch (err) {
      console.error("Error denying event:", err);
      setErrorMessage('Unable to deny that event.');
    }
  };

  const handleSave = async (updatedEvent: Event) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      await updateEventDetails(updatedEvent.id, updatedEvent);
      setEvents(prev => prev.map(event => (event.id === updatedEvent.id ? updatedEvent : event)));
    } catch (err) {
      console.error("Error saving event changes:", err);
      setErrorMessage('Unable to save event changes.');
    }
  };

  const getReviewBlockers = (event: Event) => {
    const blockers: string[] = [];
    if (!String(event.title || '').trim()) blockers.push('title');
    if (!String(event.date || '').trim()) blockers.push('date');
    if (!String(event.start_time || '').trim()) blockers.push('start time');
    if (!String(event.venue_name || event.location || '').trim()) blockers.push('venue');
    if (!String(event.region || '').trim()) blockers.push('region');
    if (event.event_poster_status === 'broken') blockers.push('broken poster');
    return blockers;
  };

  const selectedEvents = events.filter((event) => selectedIds.includes(event.id));
  const blockedSelected = selectedEvents.filter((event) => getReviewBlockers(event).length > 0);
  const readySelected = selectedEvents.length - blockedSelected.length;
  const allSelected = events.length > 0 && events.every((event) => selectedIds.includes(event.id));

  const toggleSelected = (eventId: number) => {
    setSelectedIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : events.map((event) => event.id));
  };

  const removeReviewedEvents = (ids: number[]) => {
    setEvents((prev) => {
      const next = prev.filter((event) => !ids.includes(event.id));
      onCountChange?.(next.length);
      return next;
    });
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
  };

  const runSequentially = async (ids: number[], handler: (id: number) => Promise<void>) => {
    for (const id of ids) {
      await handler(id);
    }
  };

  const bulkApprove = async () => {
    if (!selectedIds.length || blockedSelected.length) return;
    if (!window.confirm(`Approve ${selectedIds.length} selected event(s) for the public calendar?`)) return;
    setBulkActionKey('approve');
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const result = await bulkUpdateEventStatus(selectedIds, true);
      const approvedIds = result.updatedIds.length ? result.updatedIds : selectedIds.filter((id) => !result.skippedIds.includes(id));
      removeReviewedEvents(approvedIds);
      setSuccessMessage(`Approved ${result.updatedCount || approvedIds.length} event(s).${result.skippedIds.length ? ` ${result.skippedIds.length} were already handled or no longer pending.` : ''}`);
    } catch (error) {
      console.error('Bulk approve failed', error);
      setErrorMessage('Unable to bulk approve selected events. Refresh and check which events remain pending.');
    } finally {
      setBulkActionKey(null);
    }
  };

  const bulkReject = async () => {
    if (!selectedIds.length) return;
    const adminNotes = window.prompt(
      `Optional: add one note for all ${selectedIds.length} selected event(s).`,
      ''
    );
    if (!window.confirm(`Reject/delete ${selectedIds.length} selected event(s)?`)) return;
    setBulkActionKey('reject');
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await runSequentially(selectedIds, (eventId) => deleteEvent(eventId, {
        adminNotes: adminNotes || undefined,
        notifySubmitter: true,
      }));
      removeReviewedEvents(selectedIds);
      setSuccessMessage(`Rejected ${selectedIds.length} event(s).`);
    } catch (error) {
      console.error('Bulk reject failed', error);
      setErrorMessage('Unable to bulk reject selected events. Refresh and check which events remain pending.');
    } finally {
      setBulkActionKey(null);
    }
  };

  return (
    <div className="mt-8">
      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {successMessage}
        </div>
      )}
      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-10 text-center text-sm text-slate-300">
          Loading pending events...
        </div>
      ) : events.length > 0 ? (
        <>
          <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-slate-100">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <label className="inline-flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-950"
                />
                Select all pending events ({events.length})
              </label>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <span>{selectedIds.length} selected</span>
                <span>{readySelected} ready</span>
                <span>{blockedSelected.length} blocked</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={bulkApprove}
                  disabled={!selectedIds.length || blockedSelected.length > 0 || Boolean(bulkActionKey)}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bulkActionKey === 'approve' ? 'Approving...' : 'Bulk approve'}
                </button>
                <button
                  type="button"
                  onClick={bulkReject}
                  disabled={!selectedIds.length || Boolean(bulkActionKey)}
                  className="rounded-full bg-rose-500 px-4 py-2 text-xs font-black text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bulkActionKey === 'reject' ? 'Rejecting...' : 'Bulk reject/delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  disabled={!selectedIds.length || Boolean(bulkActionKey)}
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
            {blockedSelected.length > 0 && (
              <p className="mt-3 text-sm text-rose-200">
                Bulk approve is disabled because selected events need fixes first: {blockedSelected.slice(0, 3).map((event) => `${event.title || `#${event.id}`} (${getReviewBlockers(event).join(', ')})`).join('; ')}
                {blockedSelected.length > 3 ? '…' : ''}
              </p>
            )}
          </div>
          <ul className="space-y-6">
          {events.map((event) => (
            <li key={event.id} className={`rounded-md p-6 shadow-md ${selectedIds.includes(event.id) ? 'bg-emerald-50 ring-2 ring-emerald-400' : 'bg-white'}`}>
              <label className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(event.id)}
                  onChange={() => toggleSelected(event.id)}
                  className="h-4 w-4 rounded"
                />
                Select for bulk review
              </label>
              <AdminEventCard
                event={event}
                onApprove={() => handleApprove(event.id)}
                onDeny={() => handleDeny(event.id)}
                onSave={handleSave}
              />
            </li>
          ))}
          </ul>
        </>
      ) : (
        <div className="text-center text-gray-300 py-10">
          <p className="text-lg">✅ All clear — no pending events right now.</p>
        </div>
      )}
    </div>
  );
};

export default EventReview;
