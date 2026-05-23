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
    <div className="mt-6 border border-slate-800/70 bg-slate-950/90 p-5 text-slate-50 shadow-lg shadow-slate-950/70 sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-300">Suggested events</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-50">
            {user.displayName}&apos;s Music Picks
          </h2>
        </div>
        {filteredEvents.length > 0 && (
          <span className="shrink-0 border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-300">
            {filteredEvents.length}
          </span>
        )}
      </div>
      {filteredEvents.length > 0 ? (
        <div className="max-h-[32rem] overflow-y-auto pr-2 [scrollbar-color:#34d399_#0f172a] [scrollbar-width:thin]">
          <ul className="space-y-3">
            {filteredEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/eventRouter/${event.slug}`}
                  className="flex items-center gap-3 border border-slate-800 bg-slate-900/80 p-3 transition hover:border-emerald-400/70 hover:bg-slate-900"
                  aria-label={`View details for ${event.title}`}
                >
                  <EventPoster
                    posterUrl={event.poster}
                    title={event.title}
                    variant="square"
                    className="w-16 flex-shrink-0 sm:w-20"
                  />
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {parseLocalDayjs(event.date).format('ddd, MMM D')}
                    </p>
                    <p className="text-sm font-semibold text-slate-50 sm:text-base">{event.title}</p>
                    <p className="text-xs text-slate-400 sm:text-sm">
                      {event.venue_name}
                      {event.location ? ` • ${event.location}` : ''}
                    </p>
                    <p className="text-[11px] text-slate-500">{event.genre}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center">No upcoming events match your favorite genres yet.</p>
      )}
    </div>
  );
};

export default UpcomingShows;
