import React, { useEffect, useState } from 'react';
import { Event, User } from '@/interfaces/interfaces';
import FaveEventCard from './FaveEventCard';
import { UserType } from '@/types';
import { parseLocalDayjs } from '../util/dateHelper';

interface UpcomingShowsProps {
  user: UserType;
  userGenres: string;
  events: Event[];
}

const MAX_RECOMMENDATIONS = 10;

const UpcomingShows: React.FC<UpcomingShowsProps> = ({ user, userGenres, events }) => {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (userGenres && events) {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const filtered = events.filter(event => {
        const eventDate = parseLocalDayjs(event.date);
        if (!eventDate.isValid()) return false;
        return (
          userGenres.includes(event.genre) &&
          (eventDate.isSame(currentDate, "day") || eventDate.isAfter(currentDate, "day"))
        );
      });
      setFilteredEvents(filtered);
    }
  }, [userGenres, events]);

  const formatTime = (timeString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', options);
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  const eventsToDisplay = showAll ? filteredEvents : filteredEvents.slice(0, MAX_RECOMMENDATIONS);

  return (
    <div className="mt-6 rounded-3xl border border-slate-800/70 bg-slate-950/90 p-5 text-slate-50 shadow-lg shadow-slate-950/70 sm:p-6">
      <h2 className="mb-5 text-center text-xl font-semibold text-slate-50 sm:text-2xl">
        {user.displayName}&apos;s Music Picks 🎶
      </h2>
      {eventsToDisplay.length > 0 ? (
        <>
          <ul className="space-y-4">
            {eventsToDisplay.map((event) => (
              <li
                key={event.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 transition hover:border-emerald-400/70 hover:bg-slate-900"
              >
                {event.poster ? (
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-800 sm:h-20 sm:w-20">
                    <Image src={event.poster} alt={event.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:h-20 sm:w-20">
                    No poster
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {dayjs(event.date).format('ddd, MMM D')}
                  </p>
                  <p className="text-sm font-semibold text-slate-50 sm:text-base">{event.title}</p>
                  <p className="text-xs text-slate-400 sm:text-sm">
                    {event.venue_name}
                    {event.location ? ` • ${event.location}` : ''}
                  </p>
                  <p className="text-[11px] text-slate-500">{event.genre}</p>
                </div>
              </li>
            ))}
          </ul>

          {!showAll && filteredEvents.length > MAX_RECOMMENDATIONS && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll(true)}
                className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/20"
              >
                Show More
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-400 text-center">No upcoming events match your favorite genres yet.</p>
      )}
    </div>
  );
};

export default UpcomingShows;
