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
  const [edited, setEdited] = useState<Artist>({ ...artist });

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
          {/* Toggle edit/preview mode */}
          <div className="flex justify-end">
            <button
              onClick={() => setIsEditing(prev => !prev)}
              className="text-sm underline text-blue-500"
            >
              {isEditing ? 'Switch to Preview Mode' : 'Edit Mode'}
            </button>
          </div>

          {edited.profile_image && (
            <Image src={edited.profile_image} alt="Profile" width={150} height={150} className="rounded" />
          )}

          {isEditing && (
            <input type="file" accept="image/*" name="profile_image" onChange={handleFileChange} className="w-full" />
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

          {edited.genres?.length > 0 && (
            <div>
              <label className="text-sm font-medium">Genres</label>
              <p className="mt-1">{edited.genres.join(', ')}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Tip Jar URL</label>
            <input
              type="text"
              name="tip_jar_url"
              value={edited.tip_jar_url || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>


          <div>
            <label className="block text-sm font-medium">Moderation Notes</label>
            <textarea
              name="notes"
              value={edited.notes || ''}
              onChange={handleChange}
              className="mt-1 p-2 border rounded w-full"
              rows={3}
            />
          </div>

          {edited.promo_photo && (
            <div>
              <label className="text-sm font-medium">Promo Photo</label>
              <Image src={edited.promo_photo} alt="Promo" width={300} height={200} className="rounded-md" />
            </div>
          )}

          {edited.stage_plot && (
            <div>
              <label className="text-sm font-medium">Stage Plot</label>
              <Image src={edited.stage_plot} alt="Stage Plot" width={300} height={200} className="rounded-md" />
            </div>
          )}

          {edited.press_kit && (
            <div>
              <label className="text-sm font-medium">Press Kit</label>
              <a href={edited.press_kit} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                View Press Kit PDF
              </a>
            </div>
          )}

        <div>
          <label className="text-sm font-medium">YouTube Embed</label>
          {isEditing ? (
            <input
              type="text"
              name="embed_youtube"
              value={edited.embed_youtube || ''}
              onChange={handleChange}
              className="mt-1 p-2 border rounded w-full"
            />
          ) : (
            edited.embed_youtube && (
              <iframe
                src={edited.embed_youtube}
                className="w-full mt-1 rounded"
                width="100%"
                height="200"
                allowFullScreen
              />
            )
          )}
        </div>


        <div>
          <label className="text-sm font-medium">Soundcloud Embed</label>
          {isEditing ? (
            <input
              type="text"
              name="embed_soundcloud"
              value={edited.embed_soundcloud || ''}
              onChange={handleChange}
              className="mt-1 p-2 border rounded w-full"
            />
          ) : (
            edited.embed_soundcloud && (
              <iframe
                src={edited.embed_soundcloud}
                className="w-full mt-1 rounded"
                width="100%"
                height="200"
                allowFullScreen
              />
            )
          )}
        </div>


        <div>
  <label className="text-sm font-medium">Bandcamp Embed</label>
  {isEditing ? (
    <input
      type="text"
      name="embed_bandcamp"
      value={edited.embed_bandcamp || ''}
      onChange={handleChange}
      className="mt-1 p-2 border rounded w-full"
    />
  ) : (
    edited.embed_bandcamp && (
      <iframe
        src={edited.embed_bandcamp}
        className="w-full mt-1 rounded"
        width="100%"
        height="200"
        allowFullScreen
      />
    )
  )}
</div>


          {/* Action Buttons */}
          <div className="flex gap-2 justify-end mt-4">
            {isEditing && (
              <button
                onClick={handleSaveClick}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Save
              </button>
            )}
            <button
              onClick={onApprove}
              className="bg-emerald-500 text-white px-3 py-1 rounded"
            >
              Approve
            </button>
            <button
              onClick={onDeny}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Deny
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminArtistCard;
