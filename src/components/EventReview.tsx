"use client";
import { getEventsForReview, updateEventStatus } from "@/pages/api/route";
import { useState, useEffect } from "react";
import "../styles/globals.css";
import AdminEventCard from "./AdminEventCard"; // This is a new component you'll create

export interface Event {
  id:number;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  eventType: string;
  genre: string;
  ticketPrice: string;
  ageRestriction: string;
  eventLink: string;
}

interface Events {
  events: Event[];
}
const EventReview: React.FC = () => {
 
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsData:any = await getEventsForReview(); // Make sure this function fetches events awaiting approval
        setEvents(eventsData);
      } catch (error) {
        console.error('Failed to load events for review', error);
      }
    };

    fetchData();
  }, []);

  const handleApprove = async (eventId: number): Promise<void> =>  {
    // Send PUT request to approve the event
    await updateEventStatus(eventId, true);
    // Fetch the events again to reflect the changes or directly update the state
  };

  const handleDeny = async (eventId: number): Promise<void> => {
    // Send PUT request to deny the event
    await updateEventStatus(eventId, false);
    // Fetch the events again to reflect the changes or directly update the state
  };

  const handleEdit = (event: Event) => {
    // Implement functionality to edit the event
    // This can be a modal form or redirect to an edit page with the event data
  };
  console.log(events)
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
                onEdit={() => handleEdit(event)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EventReview;
