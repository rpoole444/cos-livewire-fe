import React, { useState, useEffect } from "react";
import { Event } from '../interfaces/interfaces';
import Image from "next/image";

interface AdminEventCardProps {
  event: Event;
  onApprove: () => void;
  onDeny: () => void;
  onSave: (updatedEvent: Event) => void;
}

const AdminEventCard: React.FC<AdminEventCardProps> = ({ event, onApprove, onDeny, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState(event);
  const [formattedDate, setFormattedDate] = useState('');
  const [formattedStartTime, setFormattedStartTime] = useState('');
  const [formattedEndTime, setFormattedEndTime] = useState('');

  useEffect(() => {
    // if (event.date) {
    //   const date = new Date(event.date);
    //   const year = date.getFullYear();
    //   const month = String(date.getMonth() + 1).padStart(2, '0');
    //   const day = String(date.getDate()).padStart(2, '0');
    //   setFormattedDate(`${year}-${month}-${day}`);
    // }
    if (event.date) {
      console.log("event-date :" + event.date);
      const dateStr = event.date.split('T')[0]
      const [year, month, day] = dateStr.split('-')
      const formattedDate = `${month}/${day}/${year}`;
      console.log(formattedDate);
      console.log(dateStr);
     setFormattedDate(dateStr)

    }

    if (event.start_time) {
      setFormattedStartTime(event.start_time);
    }

    if (event.end_time) {
      setFormattedEndTime(event.end_time);
    }
  }, [event.date, event.start_time, event.end_time]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedEvent({
      ...editedEvent,
      [name]: value,
    });
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    onSave(editedEvent);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col space-y-4 p-6 border rounded shadow-lg bg-white max-w-3xl mx-auto mt-6">
      <div>
        <label className="block text-md font-medium text-black mb-1" htmlFor="title">Title:</label>
        <input
          type="text"
          id="title"
          name="title"
          value={editedEvent.title}
          onChange={handleChange}
          disabled={!isEditing}
          className={`p-3 rounded border w-full text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
        />
      </div>
      <div>
        <label className="block text-md font-medium text-black mb-1" htmlFor="description">Description:</label>
        <textarea
          id="description"
          name="description"
          value={editedEvent.description}
          onChange={handleChange}
          disabled={!isEditing}
          className={`p-3 rounded border w-full text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
        />
      </div>
      {event.poster ? (
        <>
          <h2 className="block text-md font-medium text-black mb-1">Poster Image:</h2>
          <Image src={event.poster} alt="Event Poster" priority width={400} height={400} className="mx-auto mb-4" />
        </>
      ) : (
        <p className="text-center text-gray-500 mb-4">No Poster Available</p>
      )}
      <div>
        <label className="block text-md font-medium text-black mb-1" htmlFor="location">Location:</label>
        <input
          type="text"
          id="location"
          name="location"
          value={editedEvent.location}
          onChange={handleChange}
          disabled={!isEditing}
          className={`p-3 rounded border w-full text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
        />
      </div>
      <div>
        <label className="block text-md font-medium text-black mb-1" htmlFor="date">Date:</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formattedDate}
          onChange={handleChange}
          disabled={!isEditing}
          className={`p-3 rounded border w-full text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
        />
      </div>
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-md font-medium text-black mb-1" htmlFor="start_time">Start Time:</label>
          <input
            type="time"
            id="start_time"
            name="start_time"
            value={formattedStartTime}
            onChange={handleChange}
            disabled={!isEditing}
            className={`p-3 rounded border w-full text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
          />
        </div>
        <div className="flex-1">
          <label className="block text-md font-medium text-black mb-1" htmlFor="end_time">End Time:</label>
          <input
            type="time"
            id="end_time"
            name="end_time"
            value={formattedEndTime}
            onChange={handleChange}
            disabled={!isEditing}
            className={`p-3 rounded border w-full text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
          />
        </div>
      </div>
      {editedEvent.venue_name && (
        <div>
          <label className="block text-md font-medium text-black mb-1" htmlFor="venue_name">Venue Name:</label>
          <input
            type="text"
            id="venue_name"
            name="venue_name"
            value={editedEvent.venue_name}
            onChange={handleChange}
            disabled={!isEditing}
            className={`p-3 rounded border w-full text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
          />
        </div>
      )}
      <div>
        <label className="block text-md font-medium text-black mb-1" htmlFor="genre">Genre:</label>
        <input
          type="text"
          id="genre"
          name="genre"
          value={editedEvent.genre}
          onChange={handleChange}
          disabled={!isEditing}
          className={`p-3 rounded border w-full text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
        />
      </div>
      <div>
        <label className="block text-md font-medium text-black mb-1" htmlFor="ticket_price">Ticket Price:</label>
        <input
          type="number"
          id="ticket_price"
          name="ticket_price"
          value={editedEvent.ticket_price}
          onChange={handleChange}
          disabled={!isEditing}
          className={`p-3 rounded border w-full text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
        />
      </div>
      <div>
        <label className="block text-md font-medium text-black mb-1" htmlFor="age_restriction">Age Restriction:</label>
        <input
          type="text"
          id="age_restriction"
          name="age_restriction"
          value={editedEvent.age_restriction}
          onChange={handleChange}
          disabled={!isEditing}
          className={`p-3 rounded border w-full text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
        />
      </div>
      {editedEvent.website_link && (
        <div>
          <label className="block text-md font-medium text-black mb-1" htmlFor="website_link">Website Link:</label>
          <input
            type="text"
            id="website_link"
            name="website_link"
            value={editedEvent.website_link}
            onChange={handleChange}
            disabled={!isEditing}
            className={`p-3 rounded border w-full text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
          />
        </div>
      )}
      <div className="flex space-x-4 mt-4 justify-end">
        {isEditing ? (
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleSaveClick}
          >
            Save
          </button>
        ) : (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleEditClick}
          >
            Edit
          </button>
        )}
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={onApprove}
        >
          Approve
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={onDeny}
        >
          Deny
        </button>
      </div>
    </div>
  );
};

export default AdminEventCard
