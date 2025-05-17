import Link from "next/link";
import React, { useState,  } from "react";
import Image from "next/image";
import { Event } from "@/interfaces/interfaces";
import { useRouter } from 'next/router';
import { UserType } from "@/types";
interface EventCardProps {
  event: Event;
  handleCardClick?: (id: number) => void;
  handleDelete?: (id: number) => void; 
  user?: UserType | null
}

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

const EventCard: React.FC<EventCardProps> = ({ event, handleCardClick, handleDelete, user }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const toggleDescription = () => setShowFullDescription(!showFullDescription);
  const router = useRouter();

  const descriptionTooLong = event.description && event.description.length > 200;

  return (
    <div
      onClick={() => handleCardClick?.(event.id)}
      className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition duration-300 max-w-xl mx-auto cursor-pointer"
    >
      <h2 className="text-2xl font-bold text-gold mb-2">{event.title}</h2>

      <div className="text-sm text-gray-300 space-y-2">
        <p><span className="font-semibold text-white">Date:</span> {formatDate(event.date)}</p>
        {event.start_time && (
          <p><span className="font-semibold text-white">Start Time:</span> {formatTime(event.start_time)}</p>
        )}
        {event.end_time && (
          <p><span className="font-semibold text-white">End Time:</span> {formatTime(event.end_time)}</p>
        )}
        {event.genre && (
          <p><span className="font-semibold text-white">Genre:</span> {event.genre}</p>
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

      {event.description && (
        <div className="text-gray-400 text-sm mt-4">
          {descriptionTooLong && !showFullDescription
            ? `${event.description.slice(0, 200)}...`
            : event.description}
          {descriptionTooLong && (
            <button
              className="text-blue-400 hover:text-blue-200 ml-2 underline"
              onClick={(e) => {
                e.stopPropagation();
                toggleDescription();
              }}
            >
              {showFullDescription ? "See less" : "See more"}
            </button>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col space-y-2 text-sm">
        {event.website && (
          <div>
            <span className="font-semibold text-white">Venue Website:</span>{' '}
            <Link
              href={event.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-200 underline break-words"
            >
              Click here
            </Link>
          </div>
        )}
        {event.website_link && event.website_link !== "http://" && (
          <div>
            <span className="font-semibold text-white">Event / Artist Website or Ticket Link:</span>{' '}
            <Link
              href={event.website_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-200 underline break-words"
            >
              Click here
            </Link>
          </div>
        )}
      </div>

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

      {handleDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this event?")) {
              handleDelete(event.id);
            }
          }}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition"
        >
          Delete Event
        </button>
      )}
      {user && (user.id === event.user_id || user.is_admin) && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      router.push(`/events/edit/${event.id}`);
    }}
    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition"
  >
    Edit Event
  </button>
)}

    </div>
  );
};

export default EventCard;

