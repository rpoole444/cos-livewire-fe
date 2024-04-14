"use client"
import { getEvents } from "@/pages/api/route";
import Link from "next/link";
import { useState, useEffect } from "react";
import "../styles/globals.css";
import EventCard from "./EventCard";
const Events: React.FC = () => {
  const [events, setEvents] = useState([]);

   useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsData = await getEvents();
        const approvedEvents = eventsData
          .filter((activity:any) => activity.is_approved)
          .sort((a:any, b:any) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          })
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
              <Link key={event.id} href={`/eventRouter/${event.id}`} passHref>
                <EventCard event={event}/>
              </Link>
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

export default Events;
