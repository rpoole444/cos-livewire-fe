import React from 'react';
import EventDetailCard from './EventDetailCard';
import { CustomEvent } from '@/interfaces/interfaces';
import { AiOutlineCalendar } from 'react-icons/ai';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { deleteEvent } from '@/pages/api/route';

interface EventsProps {
  events: CustomEvent[];
}

const Events: React.FC<EventsProps> = ({ events }) => {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.is_admin;

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(id);
        router.reload();
      } catch (err) {
        console.error('Failed to delete event', err);
      }
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center text-white flex flex-col items-center justify-center py-10">
        <AiOutlineCalendar size={48} className="mb-4" />
        <p className="mb-4">No Events Today. Please search for more or log in to submit your event!</p>
        <Image src="/trumpet.png" alt="Trumpet" width={200} height={200} priority />
      </div>
    );
  }

  return (
    <ul className="space-y-6">
      {events.map(event => (
        <li key={event.id}>
          <EventDetailCard
            event={event}
            user={user}
            handleCardClick={() => router.push(`/eventRouter/${event.slug}`)}
            handleDelete={isAdmin ? handleDelete : undefined}
          />
        </li>
      ))}
    </ul>
  );
};

export default Events;
