import React, { useEffect, useState } from 'react';
import { Event, User } from '@/interfaces/interfaces';
import FaveEventCard from './FaveEventCard';
import { UserType } from '@/types';

interface UpcomingShowsProps {
  user: UserType
  userGenres: String;
  events: Event[];
}

const UpcomingShows: React.FC<UpcomingShowsProps> = ({ user, userGenres, events }) => {
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
    <div className="bg-white p-4 mt-5 rounded-lg shadow-lg max-h-100 overflow-y-auto justify-center">
      <h2 className="text-xl font-bold mb-4">{user.first_name} {user.last_name}&apos;s Music Recomendations</h2>
      {filteredEvents.length > 0 ? (
        filteredEvents.map(event => (
          <FaveEventCard
            key={event.id}
            id={event.id}
            title={event.title}
            genre={event.genre}
            venueName={event.venue_name}
            date={event.date}
            startTime={event.start_time}
            endTime={event.end_time}
          />
        ))
      ) : (
        <p>No upcoming events match your favorite genres.</p>
      )}
    </div>
  );
};

export default UpcomingShows;
