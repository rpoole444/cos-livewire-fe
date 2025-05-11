import React, { useEffect, useState } from 'react';
import { Event, User } from '@/interfaces/interfaces';
import FaveEventCard from './FaveEventCard';
import { UserType } from '@/types';
import { parseMSTDate } from '../util/dateHelper';

interface UpcomingShowsProps {
  user: UserType;
  userGenres: string[];
  events: Event[];
}

const MAX_RECOMMENDATIONS = 10;

const UpcomingShows: React.FC<UpcomingShowsProps> = ({ user, userGenres, events }) => {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (userGenres && events.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const matching = events
        .filter((event) => {
          const eventDate = parseMSTDate(event.date);
          eventDate.setHours(0, 0, 0, 0);
          return userGenres.includes(event.genre) && eventDate >= today;
        })
        .slice(0, MAX_RECOMMENDATIONS); // ✅ Limit to 10

      setFilteredEvents(matching);
    }
  }, [userGenres, events]);

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

  return (
    <div className="bg-white p-4 mt-5 rounded-lg shadow-lg max-h-[500px] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">
        {user.first_name} {user.last_name}&apos;s Music Recommendations
      </h2>
      {filteredEvents.length > 0 ? (
        filteredEvents.map((event) => (
          <FaveEventCard
            key={event.id}
            id={event.id}
            title={event.title}
            location={event.location}
            genre={event.genre}
            venueName={event.venue_name}
            date={event.date}
            startTime={event.start_time}
            endTime={event.end_time}
            formatTime={formatTime}
          />
        ))
      ) : (
        <p className="text-gray-600 text-sm">
          No upcoming events match your favorite genres.
        </p>
      )}
    </div>
  );
};

export default UpcomingShows;
