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
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedEvent, setEditedEvent] = useState(event);
  const [formattedDate, setFormattedDate] = useState('');
  const [formattedStartTime, setFormattedStartTime] = useState('');
  const [formattedEndTime, setFormattedEndTime] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (event.date) {
      const dateStr = event.date.split('T')[0];
      setFormattedDate(dateStr);
    }
    if (event.start_time) setFormattedStartTime(event.start_time);
    if (event.end_time) setFormattedEndTime(event.end_time);
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedEvent(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedEvent(prev => ({ ...prev, poster: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApproveClick = async () => {
    setIsApproving(true);
    try {
      await onApprove();
    } finally {
      setIsApproving(false);
    }
  };

  const handleEditClick = () => setIsEditing(true);
  const handleSaveClick = () => {
    onSave(editedEvent);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col space-y-6 p-6 border border-gray-200 rounded-lg shadow-md bg-white">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-black">{event.title}</h3>
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-blue-600 underline">
          {isExpanded ? 'Hide' : 'See More'}
        </button>
      </div>
      {isExpanded && (
        <>
          {/* Submitter Info */}
          {event.user && (
            <div>
              <p className="text-sm text-gray-600">Submitted by:</p>
              <p className="text-black font-medium">{event.user.first_name} {event.user.last_name}</p>
              <p className="text-gray-500 text-sm">{event.user.email}</p>
            </div>
          )}

          {/* Poster */}
          {editedEvent.poster ? (
            <div className="w-full">
              <p className="text-sm font-medium text-gray-700 mb-1">Poster Image</p>
              <Image src={editedEvent.poster} alt="Event Poster" width={400} height={400} className="rounded-md mx-auto" />
              {isEditing && (
                <button onClick={() => setEditedEvent(prev => ({ ...prev, poster: null }))} className="text-red-600 underline mt-1">
                  Remove Photo
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-center text-gray-400">No poster uploaded.</p>
              {isEditing && (
                <input type="file" accept="image/*" onChange={handlePosterChange} className="mt-2" />
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={editedEvent.title}
              onChange={handleChange}
              disabled={!isEditing}
              className={`mt-1 p-3 border w-full rounded-md text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
            />
          </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          name="description"
          value={editedEvent.description}
          onChange={handleChange}
          disabled={!isEditing}
          className={`mt-1 p-3 border w-full rounded-md text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
          rows={4}
        />
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="text-sm font-medium text-gray-700">Location</label>
        <input
          type="text"
          id="location"
          name="location"
          value={editedEvent.location}
          onChange={handleChange}
          disabled={!isEditing}
          className={`mt-1 p-3 border w-full rounded-md text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
        />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="date" className="text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formattedDate}
            onChange={handleChange}
            disabled={!isEditing}
            className={`mt-1 p-3 border w-full rounded-md text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
          />
        </div>
        <div>
          <label htmlFor="start_time" className="text-sm font-medium text-gray-700">Start Time</label>
          <input
            type="time"
            id="start_time"
            name="start_time"
            value={formattedStartTime}
            onChange={handleChange}
            disabled={!isEditing}
            className={`mt-1 p-3 border w-full rounded-md text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
          />
        </div>
        <div>
          <label htmlFor="end_time" className="text-sm font-medium text-gray-700">End Time</label>
          <input
            type="time"
            id="end_time"
            name="end_time"
            value={formattedEndTime}
            onChange={handleChange}
            disabled={!isEditing}
            className={`mt-1 p-3 border w-full rounded-md text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
          />
        </div>
      </div>

      {/* Optional Fields */}
      {editedEvent.venue_name && (
        <div>
          <label htmlFor="venue_name" className="text-sm font-medium text-gray-700">Venue Name</label>
          <input
            type="text"
            id="venue_name"
            name="venue_name"
            value={editedEvent.venue_name}
            onChange={handleChange}
            disabled={!isEditing}
            className={`mt-1 p-3 border w-full rounded-md text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
          />
        </div>
      )}

      <div>
        <label htmlFor="genre" className="text-sm font-medium text-gray-700">Genre</label>
        <input
          type="text"
          id="genre"
          name="genre"
          value={editedEvent.genre}
          onChange={handleChange}
          disabled={!isEditing}
          className={`mt-1 p-3 border w-full rounded-md text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
        />
      </div>

      <div>
        <label htmlFor="ticket_price" className="text-sm font-medium text-gray-700">Ticket Price</label>
        <input
          type="number"
          id="ticket_price"
          name="ticket_price"
          value={editedEvent.ticket_price}
          onChange={handleChange}
          disabled={!isEditing}
          className={`mt-1 p-3 border w-full rounded-md text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
        />
      </div>

      <div>
        <label htmlFor="age_restriction" className="text-sm font-medium text-gray-700">Age Restriction</label>
        <input
          type="text"
          id="age_restriction"
          name="age_restriction"
          value={editedEvent.age_restriction}
          onChange={handleChange}
          disabled={!isEditing}
          className={`mt-1 p-3 border w-full rounded-md text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
        />
      </div>

      {editedEvent.website_link && (
        <div>
          <label htmlFor="website_link" className="text-sm font-medium text-gray-700">Website Link</label>
          <input
            type="text"
            id="website_link"
            name="website_link"
            value={editedEvent.website_link}
            onChange={handleChange}
            disabled={!isEditing}
            className={`mt-1 p-3 border w-full rounded-md text-black ${isEditing ? 'bg-white' : 'bg-gray-100'}`}
          />
        </div>
      )}

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-3 mt-6">
            {isEditing ? (
              <button
                onClick={handleSaveClick}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Save
              </button>
            ) : (
              <button
                onClick={handleEditClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Edit
              </button>
            )}
            <button
              onClick={handleApproveClick}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md flex items-center justify-center min-w-[100px]"
              disabled={isApproving}
            >
              {isApproving ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              ) : (
                "Approve"
              )}
            </button>

            <button
              onClick={onDeny}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
            >
              Deny
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminEventCard;
