import Link from "next/link";
import React from "react";
import Image from "next/image";

const formatDate = (dateString: string) => {
  try {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      timeZoneName: 'short' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return new Date(dateString).toISOString().slice(0, 19).replace('T', ' ');
  }
};

const EventCard = ({ event }: any) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
      <p className="text-gray-400 mb-2">{formatDate(event.date)}</p>
      <p className="text-gray-300 mb-4">{event.description}</p>
      {event.venue_name && <p className="text-gray-500 mb-2">Venue: {event.venue_name}</p>}
      <p className="text-gray-500 mb-2">Address: {event.address}</p>
      {event.website && (
          <Link href={event.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 transition-colors duration-200">{event.website}</Link>
      )}
      {event.age_restriction && <p className="text-gray-500 mb-2">Age Restriction: {event.age_restriction}</p>}
      {event.ticket_price && <p className="text-gray-500 mb-2">Ticket Price: ${event.ticket_price}</p>}
      {event.website_link !== "http://" && (
        <Link
          href={event.website_link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
        >
          Event Website
        </Link>
      )}
      {event.poster ? (
        <div className="flex justify-center">
          <Image src={event.poster} alt="Event Poster" priority width={400} height={400} />
        </div>
      ) : (
        <p className="text-center text-gray-500 mb-4">-</p>
      )}
    </div>
  );
};

export default EventCard;
