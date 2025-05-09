"use client";
import { getEventsForReview, updateEventStatus, updateEventDetails, deleteEvent } from "@/pages/api/route";
import { useState, useEffect } from "react";
import "../styles/globals.css";
import AdminEventCard from "./AdminEventCard";
import { useAuth } from "../context/AuthContext";
import { Event, Events } from "../interfaces/interfaces";

const EventReview: React.FC = () => {
  const [events, setEvents] = useState<Events>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsData = await getEventsForReview();
        setEvents(eventsData);
      } catch (error) {
        console.error('Failed to load events for review', error);
      }
    };

    fetchData();
  }, []);

  const handleApprove = async (eventId: number) => {
    try {
      await updateEventStatus(eventId, true);
      setEvents(events.filter(event => event.id !== eventId));
    } catch (err) {
      console.error("Error approving event:", err);
    }
  };

  const handleDeny = async (eventId: number) => {
    try {
      await deleteEvent(eventId);
      setEvents(events.filter(event => event.id !== eventId));
    } catch (err) {
      console.error("Error denying event:", err);
    }
  };

  const handleSave = async (updatedEvent: Event) => {
    try {
      await updateEventDetails(updatedEvent.id, updatedEvent);
      setEvents(prev => prev.map(event => (event.id === updatedEvent.id ? updatedEvent : event)));
    } catch (err) {
      console.error("Error saving event changes:", err);
    }
  };

  return (
    <div className="mt-8">
      {events.length > 0 ? (
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
