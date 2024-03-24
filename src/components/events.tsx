"use client"
import { getEvents } from "@/pages/api/route";
import { useState, useEffect } from "react";
import "../styles/globals.css";
import EventCard from "./eventCard";
const EventsPage: React.FC = () => {
  const [events, setEvents] = useState([]);

   useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsData = await getEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error('Failed to load events', error);
      }
    };

    fetchData();
  }, []);

 return (
    <div>
      <h1>Events</h1>
      <div className="max-h-screen overflow-y-auto">
        <ul className="space-y-4">
          {events.map((event: any) => (
            <li key={event.id} className="border p-4 rounded shadow">
              <EventCard event={event}/>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EventsPage;
