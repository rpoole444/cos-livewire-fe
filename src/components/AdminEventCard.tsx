import React from "react";
import { Event } from './EventReview'
interface AdminEventCardProps {
  event: Event;
  onApprove: () => void;
  onDeny: () => void;
  onEdit: () => void;
}

const AdminEventCard: React.FC<AdminEventCardProps> = ({ event, onApprove, onDeny, onEdit }) => {
  return (
    <div className="flex flex-col space-y-2">
      {/* Display event details here */}
      <h2 className="text-white">{event.title}</h2>
      {/* ... other event details */}
      <div className="flex space-x-2">
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onClick={onApprove}>Approve</button>
        <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={onDeny}>Deny</button>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={onEdit}>Edit</button>
      </div>
    </div>
  );
};

export default AdminEventCard;
