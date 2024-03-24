import React from "react"

const formatDate = (dateString:string) => {
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
    // Fallback formatting
    return new Date(dateString).toISOString().slice(0, 19).replace('T', ' ');
  }
};

const EventCard = ({ event }:any) => {
 return (
    <div className="border p-4 rounded shadow">
      <h2 className="text-lg font-semibold">{event.title}</h2>
      <p className="text-gray-600">{formatDate(event.date)}</p>
      <p>{event.description}</p>
      <p className="text-gray-500">Location: {event.location}</p>
      {event.age_restriction && <p>Age Restriction: {event.age_restriction}</p>}
      {event.ticket_price && <p>Ticket Price: ${event.ticket_price}</p>}
      {event.website_link && (
        <a href={event.website_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
          Event Website
        </a>
      )}
    </div>
  );
};

export default EventCard;