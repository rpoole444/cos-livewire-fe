// src/components/MyCalendar.js
import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import '@fullcalendar/daygrid/main.css'; // Import the CSS for calendar

const EventsCalendar = ({ events }) => {
  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        // Add other props and callbacks you want to use
      />
    </div>
  );
}

export default EventsCalendar;
