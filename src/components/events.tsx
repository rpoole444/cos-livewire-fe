import Link from "next/link";
import "../styles/globals.css";
import EventCard from "./EventCard";
import { Event } from "@/interfaces/interfaces";
import { AiOutlineCalendar } from "react-icons/ai";
import Image from "next/image";

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
          <div className="text-center text-white flex flex-col items-center justify-center py-10">
            <AiOutlineCalendar size={48} className="mb-4" />
            <p className="mb-4">No Events Today, Please Search for More Upcoming Events or Login to Submit your Event!</p>
            <Image src="/trumpet.png" alt="Trumpet Image" width={200} height={200} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
