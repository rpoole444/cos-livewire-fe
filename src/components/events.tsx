"use client"
import { getEvents } from "@/pages/api/route";
import { useState, useEffect } from "react";
import "../styles/globals.css";
import EventCard from "./EventCard";
const EventsPage: React.FC = () => {
  const [events, setEvents] = useState([]);

   useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsData = await getEvents();
        const approvedEvents = eventsData.filter((activity:any) => activity.is_approved)
        setEvents(approvedEvents);
      } catch (error) {
        console.error('Failed to load events', error);
      }
    };

    fetchData();
  }, []);

 return (
    <div>
      <div className="max-h-screen overflow-y-auto">
        {events && events.length > 0 ? (
          <ul className="space-y-4">
            {events.map((event: any) => (
              <li key={event.id} className="border p-4 rounded shadow">
                <EventCard event={event}/>
              </li>
              ))}
          </ul>
          ) : (
            <p>No Events!!</p>
          )}
      </div>
    </div>
  );
};

export default EventsPage;
