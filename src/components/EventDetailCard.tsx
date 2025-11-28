import Link from "next/link";
import React, { useMemo, useState } from "react";
import { Event } from "@/interfaces/interfaces";
import { UserType } from "@/types";
import { parseLocalDayjs } from "@/util/dateHelper";
import EventPoster from "./EventPoster";

interface EventDetailCardProps {
  event: Event;
  handleCardClick?: (id: number) => void;
  handleDelete?: (id: number) => void;
  user?: UserType | null;
  expandDescription?: boolean;
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
  expandDescription = false,
}) => {
  const [showFullDescription, setShowFullDescription] = useState(expandDescription);
  const toggleDescription = () => setShowFullDescription(!showFullDescription);
  const descriptionTooLong = event.description && event.description.length > 160;

  const formattedPrice = useMemo(() => {
    if (!event.ticket_price) return null;
    const price = event.ticket_price.trim();
    if (!price) return null;
    if (/^(free|donation)/i.test(price)) return price;
    if (price.startsWith("$")) return price;
    return `$${price}`;
  }, [event.ticket_price]);

  const infoPill = (label: string) => (
    <span className="rounded-full border border-slate-700/70 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.16em] text-slate-300">
      {label}
    </span>
  );

  return (
    <div
      onClick={() => handleCardClick?.(event.id)}
      className={`rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-xl shadow-black/40 transition duration-300 sm:p-8 ${
        handleCardClick ? "cursor-pointer hover:border-emerald-400/70 hover:-translate-y-0.5" : ""
      }`}
    >
      <div className="flex flex-col gap-6 sm:flex-row">
        <EventPoster
          posterUrl={event.poster}
          title={event.title}
          variant="detail"
          className="w-full sm:w-60 max-w-lg flex-shrink-0"
        />

        <div className="flex-1 space-y-3 text-sm text-slate-300">
          <div className="flex flex-wrap items-center gap-2">
            {event.genre ? infoPill(event.genre) : null}
            {event.eventType ? infoPill(event.eventType) : null}
            {event.age_restriction ? infoPill(event.age_restriction) : null}
          </div>
          <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">{event.title}</h2>
          <p className="text-sm font-semibold text-emerald-300">
            {formatDate(event.date)}
            {event.start_time ? ` • ${formatTime(event.start_time)}` : ""}
          </p>
          {event.end_time && (
            <p className="text-xs text-slate-400">
              Ends at {formatTime(event.end_time)}
            </p>
          )}
          {event.venue_name && (
            <p className="text-sm text-slate-200">
              <span className="text-slate-400">Venue:</span> {event.venue_name}
            </p>
          )}
          {event.address && (
            <p className="text-sm text-slate-400">{event.address}</p>
          )}
          {formattedPrice && (
            <p className="text-sm text-slate-200">
              <span className="text-slate-400">Price:</span> {formattedPrice}
            </p>
          )}

          {event.description && (
            <div className="text-sm leading-relaxed text-slate-300">
              {descriptionTooLong && !showFullDescription
                ? `${event.description.slice(0, 200)}…`
                : event.description}
              {descriptionTooLong && !expandDescription && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDescription();
                  }}
                  className="ml-2 text-xs font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200"
                >
                  {showFullDescription ? "See less" : "See more"}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2 text-xs">
            {event.website && (
              <Link
                href={event.website}
                target="_blank"
                className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-slate-100 hover:border-emerald-300 hover:text-emerald-200"
              >
                Venue website →
              </Link>
            )}
            {event.website_link && event.website_link !== "http://" && (
              <Link
                href={event.website_link}
                target="_blank"
                className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-slate-100 hover:border-emerald-300 hover:text-emerald-200"
              >
                Tickets / RSVP →
              </Link>
            )}
          </div>

          {handleDelete && (
            <div className="flex flex-wrap gap-2 pt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this event?")) {
                    handleDelete(event.id);
                  }
                }}
                className="inline-flex items-center rounded-lg border border-rose-500/60 px-4 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-500/10"
              >
                Delete event
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailCard;
