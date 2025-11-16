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
    <div className="bg-white p-5 mt-6 rounded-2xl shadow-lg max-h-[520px] overflow-y-auto border border-gray-300">
      <h2 className="text-xl font-bold text-indigo-700 mb-4 text-center">
        {user.displayName}&apos;s Music Picks 🎶
      </h2>
      {eventsToDisplay.length > 0 ? (
        <>
          <ul className="space-y-4">
            {eventsToDisplay.map(event => (
              <li key={event.id}>
                <FaveEventCard
                  id={event.id}
                  title={event.title}
                  genre={event.genre}
                  venueName={event.venue_name}
                  date={event.date}
                  startTime={event.start_time}
                  slug={event.slug}
                  formatTime={formatTime}
                />
              </li>
            ))}
          </ul>

          {!showAll && filteredEvents.length > MAX_RECOMMENDATIONS && (
            <div className="text-center mt-4">
              <button
                onClick={() => setShowAll(true)}
                className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition"
              >
                Show More
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-600 text-sm text-center">
          No upcoming events match your favorite genres yet.
        </p>
      )}
    </div>
  );
};

export default UpcomingShows;
