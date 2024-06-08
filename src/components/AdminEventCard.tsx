import React, { useState, useEffect } from "react";
import { Event } from '../interfaces/interfaces';

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

console.log(editedEvent)
 useEffect(() => {
    if (event.date) {
      const date = new Date(event.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setFormattedDate(`${year}-${month}-${day}`);
    }
  }, [event.date]);

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
    <div className="flex flex-col space-y-4 p-6 border rounded shadow-lg bg-white max-w-3xl mx-auto">
      <input
        type="text"
        name="title"
        value={editedEvent.title}
        onChange={handleChange}
        disabled={!isEditing}
        className={`p-3 rounded border text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
      />
      <textarea
        name="description"
        value={editedEvent.description}
        onChange={handleChange}
        disabled={!isEditing}
        className={`p-3 rounded border text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
      />
      <input
        type="text"
        name="location"
        value={editedEvent.location}
        onChange={handleChange}
        disabled={!isEditing}
        className={`p-3 rounded border text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
      />
      <input
        type="date"
        name="date"
        value={formattedDate}
        onChange={handleChange}
        disabled={!isEditing}
        className={`p-3 rounded border text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
      />
      {editedEvent.venue_name && (
        <input
          type="text"
          name="venue_name"
          value={editedEvent.venue_name}
          onChange={handleChange}
          disabled={!isEditing}
          className={`p-3 rounded border text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
        />
      )}
      <input
        type="text"
        name="genre"
        value={editedEvent.genre}
        onChange={handleChange}
        disabled={!isEditing}
        className={`p-3 rounded border text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
      />
      <input
        type="number"
        name="ticket_price"
        value={editedEvent.ticket_price}
        onChange={handleChange}
        disabled={!isEditing}
        className={`p-3 rounded border text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
      />
      <input
        type="text"
        name="age_restriction"
        value={editedEvent.age_restriction}
        onChange={handleChange}
        disabled={!isEditing}
        className={`p-3 rounded border text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
      />
      {editedEvent.website_link && (
        <input
          type="text"
          name="website_link"
          value={editedEvent.website_link}
          onChange={handleChange}
          disabled={!isEditing}
          className={`p-3 rounded border text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
        />
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

export default AdminEventCard;
