"use client";
import { getEventsForReview, updateEventStatus, updateEventDetails, deleteEvent } from "@/pages/api/route";
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
      await deleteEvent(eventId);
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
      await updateEventDetails(updatedEvent.id, updatedEvent);
      setEvents(prev => prev.map(event => (event.id === updatedEvent.id ? updatedEvent : event)));
    } catch (err) {
      console.error("Error saving event changes:", err);
      setErrorMessage('Unable to save event changes.');
    }
  };

  return (
    <div className="mt-8">
      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </div>
      )}
      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-10 text-center text-sm text-slate-300">
          Loading pending events...
        </div>
      ) : events.length > 0 ? (
        <ul className="space-y-6">
          {events.map((event) => (
            <li key={event.id} className="bg-white rounded-md shadow-md p-6">
              <AdminEventCard
                event={event}
                onApprove={() => handleApprove(event.id)}
                onDeny={() => handleDeny(event.id)}
                onSave={handleSave}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-300 py-10">
          <p className="text-lg">✅ All clear — no pending events right now.</p>
        </div>
      )}
    </div>
  );
};

export default EventReview;
