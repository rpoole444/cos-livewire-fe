import React, { useEffect, useState } from 'react';
import { Event } from '@/interfaces/interfaces';
import FaveEventCard from './FaveEventCard';

interface UpcomingShowsProps {
  userGenres: String;
  events: Event[];
}

const UpcomingShows: React.FC<UpcomingShowsProps> = ({ userGenres, events }) => {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (userGenres && events) {
      const filtered = events.filter(event =>
        userGenres.includes(event.genre)
      );
      setFilteredEvents(filtered);
    }
  }, [userGenres, events]);

  return (
    <div className="bg-white p-4 mt-5 rounded-lg shadow-lg max-h-100 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Upcoming Music You Might Be Interested In...</h2>
      {filteredEvents.length > 0 ? (
        filteredEvents.map(event => (
          <FaveEventCard
            key={event.id}
            id={event.id}
            title={event.title}
            genre={event.genre}
            venueName={event.venue_name}
            date={event.date}
            time={event.time}
          />
        ))
      ) : (
        <p>No upcoming events match your favorite genres.</p>
      )}
    </div>
  );
};

export default UpcomingShows;
