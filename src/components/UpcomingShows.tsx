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
      const currentDate = new Date(); // Current date
      currentDate.setHours(0, 0, 0, 0);
      const filtered = events.filter(event =>{
        const eventDate = new Date(event.date); // Parse event date
        eventDate.setHours(0, 0, 0, 0);
        return userGenres.includes(event.genre) && eventDate >= currentDate; // Only future events
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

  return (
    <div className="bg-white p-4 mt-5 rounded-lg shadow-lg max-h-100 overflow-y-auto justify-center">
      <h2 className="text-xl font-bold mb-4">{user.first_name} {user.last_name}&apos;s Upcoming Music Recomendations</h2>
      {filteredEvents.length > 0 ? (
        filteredEvents.map(event => (
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
        <p>No upcoming events match your favorite genres.</p>
      )}
    </div>
  );
};

export default UpcomingShows;
