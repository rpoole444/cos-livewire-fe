import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";
import { Event } from "@/interfaces/interfaces";
import { useRouter } from "next/router";
import { UserType } from "@/types";

interface EventCardProps {
  event: Event;
  handleCardClick?: (id: number) => void;
  handleDelete?: (id: number) => void;
  user?: UserType | null;
}

const formatDate = (dateString: string) => {
  try {
    const [yyyy, mm, dd] = dateString.split("T")[0].split("-");
    const localDate = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return localDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Denver",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

const formatTime = (timeString: string) => {
  try {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Error formatting time:", error);
    return timeString;
  }
};

const EventCard: React.FC<EventCardProps> = ({
  event,
  handleCardClick,
  handleDelete,
  user,
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const toggleDescription = () => setShowFullDescription(!showFullDescription);
  const router = useRouter();

  const descriptionTooLong =
    event.description && event.description.length > 140;

  return (
    <div
      onClick={() => handleCardClick?.(event.id)}
      className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition duration-300 cursor-pointer p-4"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Poster */}
        {event.poster ? (
          <div className="flex-shrink-0 w-full sm:w-[150px] h-[150px] relative">
            <Image
              src={event.poster}
              alt={`${event.title} Poster`}
              fill
              className="object-cover rounded-md"
            />
          </div>
        ) : (
          <div className="w-full sm:w-[150px] h-[150px] bg-gray-700 text-center flex items-center justify-center rounded-md text-gray-400">
            No Poster
          </div>
        )}

        {/* Details */}
        <div className="flex-1 text-sm text-gray-300 space-y-1">
          <h2 className="text-lg font-bold text-gold">{event.title}</h2>
          <p>
            <span className="font-semibold text-white">Date:</span>{" "}
            {formatDate(event.date)}
          </p>
          {event.start_time && (
            <p>
              <span className="font-semibold text-white">Start:</span>{" "}
              {formatTime(event.start_time)}
            </p>
          )}
          {event.end_time && (
            <p>
              <span className="font-semibold text-white">End:</span>{" "}
              {formatTime(event.end_time)}
            </p>
          )}
          {event.venue_name && (
            <p>
              <span className="font-semibold text-white">Venue:</span>{" "}
              {event.venue_name}
            </p>
          )}
          {event.address && (
            <p>
              <span className="font-semibold text-white">Address:</span>{" "}
              {event.address}
            </p>
          )}
          {event.genre && (
            <p>
              <span className="font-semibold text-white">Genre:</span>{" "}
              {event.genre}
            </p>
          )}
          {event.ticket_price && (
            <p>
              <span className="font-semibold text-white">Price:</span> $
              {event.ticket_price}
            </p>
          )}
          {event.age_restriction && (
            <p>
              <span className="font-semibold text-white">Age:</span>{" "}
              {event.age_restriction}
            </p>
          )}

          {/* Description */}
          {event.description && (
            <div className="text-gray-400">
              {descriptionTooLong && !showFullDescription
                ? `${event.description.slice(0, 140)}...`
                : event.description}
              {descriptionTooLong && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDescription();
                  }}
                  className="ml-2 text-blue-400 hover:text-blue-200 underline text-xs"
                >
                  {showFullDescription ? "See less" : "See more"}
                </button>
              )}
            </div>
          )}

          {/* Links */}
          <div className="mt-2 flex flex-col gap-1 text-xs">
            {event.website && (
              <Link
                href={event.website}
                target="_blank"
                className="text-blue-400 hover:text-blue-200 underline break-words"
              >
                Venue Website
              </Link>
            )}
            {event.website_link &&
              event.website_link !== "http://" && (
                <Link
                  href={event.website_link}
                  target="_blank"
                  className="text-blue-400 hover:text-blue-200 underline break-words"
                >
                  Tickets / Event Website
                </Link>
              )}
          </div>

          {/* Buttons */}
          <div className="mt-3 flex gap-2 flex-wrap">
            {handleDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this event?")) {
                    handleDelete(event.id);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-xs"
              >
                Delete
              </button>
            )}
            {user && (user.id === event.user_id || user.is_admin) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/events/edit/${event.id}`);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-xs"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
