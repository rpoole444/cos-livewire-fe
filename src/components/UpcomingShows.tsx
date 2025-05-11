import React, { useEffect, useState } from 'react';
import { Event, User } from '@/interfaces/interfaces';
import FaveEventCard from './FaveEventCard';
import { UserType } from '@/types';
import { parseMSTDate } from '../util/dateHelper';

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
        const eventDate = parseMSTDate(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return userGenres.includes(event.genre) && eventDate >= currentDate;
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
    <div className="bg-white p-4 mt-5 rounded-lg shadow-lg max-h-100 overflow-y-auto justify-center">
      <h2 className="text-xl font-bold mb-4">{user.display_name}&apos;s Upcoming Music Recommendations</h2>
      {eventsToDisplay.length > 0 ? (
        <>
          {eventsToDisplay.map(event => (
            <FaveEventCard
              key={event.id}
              id={event.id}
              title={event.title}
              genre={event.genre}
              venueName={event.venue_name}
              date={event.date}
              startTime={event.start_time}
              formatTime={formatTime}
            />

          ))}
          {!showAll && filteredEvents.length > MAX_RECOMMENDATIONS && (
            <div className="text-center mt-4">
              <button
                onClick={() => setShowAll(true)}
                className="text-indigo-600 hover:underline text-sm"
              >
                See more...
              </button>
            </div>
          )}
        </>
      ) : (
        <p>No upcoming events match your favorite genres.</p>
      )}
    </div>
  );
};

export default UpcomingShows;
