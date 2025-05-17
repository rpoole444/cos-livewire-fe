import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Event } from '@/interfaces/interfaces';

const EditEventPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [eventData, setEventData] = useState<Event | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [removePoster, setRemovePoster] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/events/${id}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setEventData(data))
        .catch(err => console.error('Error loading event:', err));
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEventData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventData) return;

    const formData = new FormData();
    Object.entries(eventData).forEach(([key, value]) => {
      if (typeof value === 'string') formData.append(key, value);
    });

    formData.append('removePoster', String(removePoster));
    if (file) formData.append('poster', file);

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      if (res.ok) {
        router.push('/AdminServices'); // or wherever you want to redirect
      } else {
        const err = await res.json();
        alert(`Error: ${err.message}`);
      }
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!eventData) return <div className="text-white p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <input
          name="title"
          value={eventData.title}
          onChange={handleChange}
          placeholder="Title"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Description */}
        <textarea
          name="description"
          value={eventData.description}
          onChange={handleChange}
          placeholder="Description"
          rows={4}
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Location */}
        <input
          name="location"
          value={eventData.location}
          onChange={handleChange}
          placeholder="Location"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Date */}
        <input
          type="date"
          name="date"
          value={eventData.date?.split('T')[0] || ''}
          onChange={handleChange}
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Start & End Time */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="time"
            name="start_time"
            value={eventData.start_time}
            onChange={handleChange}
            className="p-2 bg-gray-900 border border-gray-700 rounded"
          />
          <input
            type="time"
            name="end_time"
            value={eventData.end_time}
            onChange={handleChange}
            className="p-2 bg-gray-900 border border-gray-700 rounded"
          />
        </div>

        {/* Genre */}
        <input
          name="genre"
          value={eventData.genre}
          onChange={handleChange}
          placeholder="Genre"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Ticket Price */}
        <input
          name="ticket_price"
          value={eventData.ticket_price}
          onChange={handleChange}
          placeholder="Ticket Price"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Website Link */}
        <input
          name="website_link"
          value={eventData.website_link}
          onChange={handleChange}
          placeholder="Website / Ticket Link"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Poster */}
        {eventData.poster && !removePoster && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Current Poster:</p>
            <Image
              src={eventData.poster}
              alt="Poster"
              width={300}
              height={300}
              className="rounded shadow"
            />
            <label className="mt-2 inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={removePoster}
                onChange={() => setRemovePoster(!removePoster)}
              />
              <span className="text-sm">Remove current poster</span>
            </label>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1">Upload New Poster</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block text-white"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 py-2 px-4 rounded text-white"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditEventPage;
