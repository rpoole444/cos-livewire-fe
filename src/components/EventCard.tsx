import Link from "next/link";
import React from "react";
import Image from "next/image";
import { Event } from "@/interfaces/interfaces";

interface EventCardProps {
  event: Event;
  handleCardClick?: (id: number) => void;
}

// ✅ CLEANED: Removed console.logs and simplified
const formatDate = (dateString: string) => {
  try {
    const [yyyy, mm, dd] = dateString.split('T')[0].split('-');
    const localDate = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return localDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Denver',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return "";
  }
};

// ✅ FIXED: added missing backticks in Date constructor string
const formatTime = (timeString: string) => {
  try {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

const EventCard: React.FC<EventCardProps> = ({ event, handleCardClick }) => {
  return (
    <div
      onClick={() => handleCardClick?.(event.id)}
      className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition duration-300 max-w-xl mx-auto cursor-pointer"
    >
      {/* ✅ NEW: Consistent spacing and layout */}
      <h2 className="text-2xl font-bold text-gold mb-2">{event.title}</h2>

      <div className="text-sm text-gray-300 space-y-2">
        {/* ✅ NEW: Bold labels and vertical spacing */}
        <p><span className="font-semibold text-white">Date:</span> {formatDate(event.date)}</p>
        {event.start_time && (
          <p><span className="font-semibold text-white">Start Time:</span> {formatTime(event.start_time)}</p>
        )}
        {event.end_time && (
          <p><span className="font-semibold text-white">End Time:</span> {formatTime(event.end_time)}</p>
        )}
        {event.age_restriction && (
          <p><span className="font-semibold text-white">Age Restriction:</span> {event.age_restriction}</p>
        )}
        {event.ticket_price && (
          <p><span className="font-semibold text-white">Ticket Price:</span> ${event.ticket_price}</p>
        )}
        {event.venue_name && (
          <p><span className="font-semibold text-white">Venue:</span> {event.venue_name}</p>
        )}
        <p><span className="font-semibold text-white">Address:</span> {event.address}</p>
      </div>

      {/* ✅ MOVED + STYLED: Description now below metadata */}
      {event.description && (
        <p className="text-gray-400 text-sm mt-4">{event.description}</p>
      )}

      {/* ✅ STYLED LINKS: Underline and hover effects */}
      <div className="mt-4 space-y-2">
        {event.website && (
          <Link
            href={event.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-200 underline text-sm"
          >
            Artist Website
          </Link>
        )}
        {event.website_link && event.website_link !== "http://" && (
          <Link
            href={event.website_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-200 underline text-sm"
          >
            Event Website
          </Link>
        )}
      </div>

      {/* ✅ POSTER: Responsive styling */}
      {event.poster ? (
        <div className="mt-6 flex justify-center">
          <Image
            src={event.poster}
            alt={`${event.title} Poster`}
            width={600}
            height={400}
            className="rounded-lg shadow-lg object-contain"
          />
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-6">No poster available</p>
      )}
    </div>
  );
};

export default EventCard;
