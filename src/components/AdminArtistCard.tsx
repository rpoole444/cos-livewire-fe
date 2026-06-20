import React, { useState } from 'react';
import Image from 'next/image';
import { Artist } from '../interfaces/interfaces';
import { DEFAULT_REGION, MUSIC_REGIONS, getRegionLabel } from '@/constants/regions';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
          {artist.profile_type === 'venue' ? '🏛️' : artist.profile_type === 'promoter' ? '📣' : '🎵'} {artist.display_name}
        </h3>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
          {getRegionLabel(artist.home_region)}
        </span>
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
            <label className="block text-sm font-medium">Profile Type</label>
            <select
              name="profile_type"
              value={edited.profile_type || 'artist'}
              onChange={handleChange}
              disabled={!isEditing}
              className="mt-1 w-full rounded border p-2"
            >
              <option value="artist">Artist</option>
              <option value="venue">Venue</option>
              <option value="promoter">Promoter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Home Region</label>
            <select
              name="home_region"
              value={edited.home_region || DEFAULT_REGION}
              onChange={handleChange}
              disabled={!isEditing}
              className="mt-1 w-full rounded border p-2"
            >
              {MUSIC_REGIONS.map((region) => (
                <option key={region.slug} value={region.slug}>
                  {region.label}
                </option>
              ))}
            </select>
          </div>

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

          {edited.profile_type === 'venue' && (
            <div className="grid gap-3 rounded border border-amber-300 bg-amber-50 p-3 sm:grid-cols-2">
              <input name="venue_address" value={edited.venue_address || ''} onChange={handleChange} disabled={!isEditing} placeholder="Street address" className="rounded border p-2" />
              <input name="venue_city" value={edited.venue_city || ''} onChange={handleChange} disabled={!isEditing} placeholder="City" className="rounded border p-2" />
              <input name="venue_state" value={edited.venue_state || ''} onChange={handleChange} disabled={!isEditing} placeholder="State" className="rounded border p-2" />
              <input name="venue_postal_code" value={edited.venue_postal_code || ''} onChange={handleChange} disabled={!isEditing} placeholder="ZIP" className="rounded border p-2" />
              <input name="booking_email" value={edited.booking_email || ''} onChange={handleChange} disabled={!isEditing} placeholder="Booking email" className="rounded border p-2" />
              <input name="venue_phone" value={edited.venue_phone || ''} onChange={handleChange} disabled={!isEditing} placeholder="Phone" className="rounded border p-2" />
              <input name="venue_capacity" type="number" value={edited.venue_capacity || ''} onChange={handleChange} disabled={!isEditing} placeholder="Capacity" className="rounded border p-2" />
              <input name="age_policy" value={edited.age_policy || ''} onChange={handleChange} disabled={!isEditing} placeholder="Age policy" className="rounded border p-2" />
              <input name="venue_stage_size" value={edited.venue_stage_size || ''} onChange={handleChange} disabled={!isEditing} placeholder="Stage size" className="rounded border p-2" />
              <input name="venue_sound_contact" value={edited.venue_sound_contact || ''} onChange={handleChange} disabled={!isEditing} placeholder="Sound contact" className="rounded border p-2" />
              <textarea name="venue_pa_details" value={edited.venue_pa_details || ''} onChange={handleChange} disabled={!isEditing} placeholder="PA / sound details" className="rounded border p-2 sm:col-span-2" />
              <textarea name="venue_backline" value={edited.venue_backline || ''} onChange={handleChange} disabled={!isEditing} placeholder="Backline" className="rounded border p-2 sm:col-span-2" />
              <textarea name="venue_load_in" value={edited.venue_load_in || ''} onChange={handleChange} disabled={!isEditing} placeholder="Load-in instructions" className="rounded border p-2 sm:col-span-2" />
              <textarea name="venue_parking" value={edited.venue_parking || ''} onChange={handleChange} disabled={!isEditing} placeholder="Artist parking" className="rounded border p-2 sm:col-span-2" />
              <textarea name="venue_green_room" value={edited.venue_green_room || ''} onChange={handleChange} disabled={!isEditing} placeholder="Green room / hospitality" className="rounded border p-2 sm:col-span-2" />
              <textarea name="venue_booking_policy" value={edited.venue_booking_policy || ''} onChange={handleChange} disabled={!isEditing} placeholder="Booking policy" className="rounded border p-2 sm:col-span-2" />
            </div>
          )}

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
