import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Event } from "@/interfaces/interfaces";
import { UserType } from "@/types";
import { parseLocalDayjs } from "../util/dateHelper";
import EventPoster from "./EventPoster";

interface UpcomingShowsProps {
  user: UserType;
  userGenres: string | string[];
  events: Event[];
}

const UpcomingShows: React.FC<UpcomingShowsProps> = ({ user, userGenres, events }) => {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  useEffect(() => {
    const genres = Array.isArray(userGenres) ? userGenres : [userGenres].filter(Boolean);

    if (genres.length && events) {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const filtered = events.filter(event => {
        const eventDate = parseLocalDayjs(event.date);
        if (!eventDate.isValid()) return false;
        return (
          genres.includes(event.genre) &&
          (eventDate.isSame(currentDate, "day") || eventDate.isAfter(currentDate, "day"))
        );
      });
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents([]);
    }
  }, [userGenres, events]);

  return (
    <div className="mt-6 border border-gold/30 bg-black/60 p-5 text-ivory shadow-lg shadow-black/70 sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-alpine">Suggested events</p>
          <h2 className="agg-display mt-1 text-xl font-semibold text-sun-gold">
            {user.displayName}&apos;s Music Picks
          </h2>
        </div>
        {filteredEvents.length > 0 && (
          <span className="shrink-0 border border-gold/40 bg-[#11130e] px-2.5 py-1 text-xs font-semibold text-mist">
            {filteredEvents.length}
          </span>
        )}
      </div>
      {filteredEvents.length > 0 ? (
        <div className="max-h-[32rem] overflow-y-auto pr-2 [scrollbar-color:#c9962e_#11130e] [scrollbar-width:thin]">
          <ul className="space-y-3">
            {filteredEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/eventRouter/${event.slug}`}
                  className="flex items-center gap-3 border border-gold/25 bg-[#11130e] p-3 transition hover:border-sun-gold"
                  aria-label={`View details for ${event.title}`}
                >
                  <EventPoster
                    posterUrl={event.display_image_url || event.poster}
                    title={event.title}
                    variant="square"
                    className="w-16 flex-shrink-0 sm:w-20"
                  />
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-alpine">
                      {parseLocalDayjs(event.date).format('ddd, MMM D')}
                    </p>
                    <p className="text-sm font-semibold text-ivory sm:text-base">{event.title}</p>
                    <p className="text-xs text-ivory/55 sm:text-sm">
                      {event.venue_name}
                      {event.location ? ` • ${event.location}` : ''}
                    </p>
                    <p className="text-[11px] text-copper">{event.genre}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-center text-sm text-ivory/45">No upcoming events match your favorite genres yet.</p>
      )}
    </div>
  );
};

export default UpcomingShows;
