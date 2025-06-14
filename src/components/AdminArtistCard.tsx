import React, { useState } from 'react';
import Image from 'next/image';
import { Artist } from '../interfaces/interfaces';

interface Props {
  artist: Artist;
  onApprove: () => void;
  onDeny: () => void;
  onSave: (updated: Artist) => void;
}

const AdminArtistCard: React.FC<Props> = ({ artist, onApprove, onDeny, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [edited, setEdited] = useState<Artist>(artist);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEdited(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEdited(prev => ({ ...prev, profile_image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClick = () => {
    onSave(edited);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-md shadow-md text-black p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-1">
          🎵 {artist.display_name}
        </h3>
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-blue-600 underline">
          {isExpanded ? 'Hide' : 'See More'}
        </button>
      </div>
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {edited.profile_image && (
            <Image src={edited.profile_image} alt="Profile" width={150} height={150} className="rounded" />
          )}
          {isEditing && (
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full" />
          )}
          <div>
            <label className="block text-sm font-medium">Display Name</label>
            <input
              type="text"
              name="display_name"
              value={edited.display_name}
              onChange={handleChange}
              disabled={!isEditing}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Bio</label>
            <textarea
              name="bio"
              value={edited.bio}
              onChange={handleChange}
              disabled={!isEditing}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Contact Email</label>
            <input
              type="email"
              name="contact_email"
              value={edited.contact_email}
              onChange={handleChange}
              disabled={!isEditing}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Website</label>
            <input
              type="text"
              name="website"
              value={edited.website || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div className="flex gap-2 justify-end">
            {isEditing ? (
              <button onClick={handleSaveClick} className="bg-green-600 text-white px-3 py-1 rounded">
                Save
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="bg-blue-600 text-white px-3 py-1 rounded">
                Edit
              </button>
            )}
            <button onClick={onApprove} className="bg-emerald-500 text-white px-3 py-1 rounded">
              Approve
            </button>
            <button onClick={onDeny} className="bg-red-600 text-white px-3 py-1 rounded">
              Deny
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminArtistCard;
