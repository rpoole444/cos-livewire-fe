import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";
import { Event } from "@/interfaces/interfaces";
import { UserType } from "@/types";
import { parseLocalDayjs } from "@/util/dateHelper";

interface EventDetailCardProps {
  event: Event;
  handleCardClick?: (id: number) => void;
  handleDelete?: (id: number) => void;
  user?: UserType | null;
}

const formatDate = (dateString: string) => {
  const parsed = parseLocalDayjs(dateString);
  if (!parsed.isValid()) {
    console.warn("[EventDetailCard] invalid date", dateString);
    return "Date TBA";
  }

  return parsed.format("MMMM D, YYYY");
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

const EventDetailCard: React.FC<EventDetailCardProps> = ({
  event,
  handleCardClick,
  handleDelete,
  user,
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const toggleDescription = () => setShowFullDescription(!showFullDescription);
  const descriptionTooLong =
    event.description && event.description.length > 140;

  return (
    <div
      onClick={() => handleCardClick?.(event.id)}
      className="bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition duration-300 cursor-pointer p-4"
    >
      <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="w-full sm:w-[150px] h-[150px] bg-gray-800 flex flex-col items-center justify-center rounded-md text-center p-2">
            <Image
              src="/alpine_groove_guide_icon.png"
              alt="Alpine Groove Guide Logo"
              width={48}
              height={48}
              className="mb-2"
            />
            <p className="text-xs text-white leading-tight">
              Go check out <strong>{event.title}</strong>!
            </p>
          </div>
        )}

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

          {handleDelete && (
            <div className="mt-3 flex gap-2 flex-wrap">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailCard;
