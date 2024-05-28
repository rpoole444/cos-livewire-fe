import Link from "next/link";
import "../styles/globals.css";
import EventCard from "./EventCard";
import { Event } from "@/interfaces/interfaces";

interface EventsProps {
  events: Event[];
}

const Events: React.FC<EventsProps> = ({ events }) => {
  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
      <div className="max-h-screen overflow-y-auto">
        {events && events.length > 0 ? (
          <ul className="space-y-6">
            {events.map((event) => (
              <li key={event.id}>
                <Link href={`/eventRouter/${event.id}`} passHref>
                  <EventCard event={event} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-white">No Events Today, Try Tomorrow!</p>
        )}
      </div>
    </div>
  );
};

export default Events;
