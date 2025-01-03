"use client";
import { getEventsForReview, updateEventStatus, updateEventDetails, deleteEvent } from "@/pages/api/route";
import { useState, useEffect } from "react";
import "../styles/globals.css";
import AdminEventCard from "./AdminEventCard"; // This is a new component you'll create
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { Event, Events } from "../interfaces/interfaces";

const EventReview: React.FC = () => {
  const [events, setEvents] = useState<Events>([]);
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsData: any = await getEventsForReview(); // Make sure this function fetches events awaiting approval
        console.table(eventsData)
        setEvents(eventsData);
      } catch (error) {
        console.error('Failed to load events for review', error);
      }
    };

    fetchData();
  }, []);

  const handleApprove = async (eventId: number): Promise<void> => {
    // Send PUT request to approve the event
    await updateEventStatus(eventId, true);
    // Fetch the events again to reflect the changes or directly update the state
    setEvents(events.filter(activity => activity.id !== eventId));
  };

  const handleDeny = async (eventId: number): Promise<void> => {
    if (user) {
      try {
        await deleteEvent(eventId);
        setEvents(prevEvents => prevEvents.filter(activity => activity.id !== eventId));
      } catch (error) {
        console.error('Error denying the event', error);
      }
    }
  };

  const handleSave = async (updatedEvent: Event): Promise<void> => {
    try {
      await updateEventDetails(updatedEvent.id, updatedEvent);
      // Update the local state to reflect the changes
      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === updatedEvent.id ? updatedEvent : event))
      );
    } catch (error) {
      console.error('Failed to save event', error);
    }
  };

  if (events.length > 0) {
    return (
      <div>
        <div className="max-h-screen overflow-y-auto">
          <ul className="space-y-4">
            {events.map((event: any) => (
              <li key={event.id} className="border p-4 rounded shadow">
                <AdminEventCard
                  event={event}
                  onApprove={() => handleApprove(event.id)}
                  onDeny={() => handleDeny(event.id)}
                  onSave={handleSave}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <p className="text-white text-lg">No events to review, but keep an eye out!!</p>
      </div>
    );
  }
};

export default EventReview;
