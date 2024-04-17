import Link from "next/link";
import "../styles/globals.css";
import EventCard from "./EventCard";
import { Event } from "@/interfaces/interfaces";

interface EventsProps {
  events: Event[];
}
const Events: React.FC<EventsProps> = ({ events }) => {


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
            <p>No Events Today, Try Tomorrow!!</p>
          )}
      </div>
    </div>
  );
};

export default Events;
