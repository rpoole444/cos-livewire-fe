import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Event } from '@/interfaces/interfaces';
import Header from '@/components/Header';
import Link from 'next/link';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

const EditEventPage = () => {
  /* ── router + URL param ────────────────────────────── */
  const router = useRouter();
  const { editId } = router.query;          // ← string | string[] | undefined

  /* ── local state (hooks MUST be first) ─────────────── */
  const [eventData, setEventData] = useState<Event | null>(null);
  const [file,       setFile]       = useState<File | null>(null);
  const [removePoster, setRemovePoster] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── fetch event once router & param are ready ─────── */
  useEffect(() => {
    if (!router.isReady || typeof editId !== 'string') return;

    (async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/api/events/${editId}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch event');
        const data = await res.json();
        setEventData(data);
      } catch (err) {
        console.error('Error loading event:', err);
      }
    })();
  }, [router.isReady, editId]);

  /* ── early-return placeholders (after hooks) ───────── */
  if (!router.isReady || typeof editId !== 'string')
    return <div className="text-white p-6">Loading event data…</div>;

  if (!eventData)
    return <div className="text-white p-6">Loading event…</div>;

  /* ── helpers ───────────────────────────────────────── */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEventData((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const formData = new FormData();
    Object.entries(eventData).forEach(([k, v]) =>
      formData.append(k, String(v ?? ''))
    );
    formData.append('removePoster', String(removePoster));
    if (file) formData.append('poster', file);
  
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/events/${editId}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });
  
      if (res.ok) {
        const updated = await res.json();          // ← updated event
        router.push(`/eventRouter/${editId}`); // go to detail page
      } else {
        const { message } = await res.json();
        alert(`Error: ${message}`);
      }                 // ← this brace closes the if/else
    } catch (err) {     // ← this brace closes the try
      console.error('Update failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  

  /* ── render form ───────────────────────────────────── */
  return (
    <div className="p-6 max-w-2xl mx-auto text-white">
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />

      <div className="px-6 pt-2">
        <Link href="/" passHref>
          <span className="text-sm text-yellow-300 hover:underline">
            ← Back&nbsp;to&nbsp;All&nbsp;Events
          </span>
        </Link>
      </div>

     <div className="p-6 max-w-2xl mx-auto"></div>
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <input
          name="title"
          value={eventData.title ?? ''}
          onChange={handleChange}
          placeholder="Title"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Description */}
        <textarea
          name="description"
          value={eventData.description ?? ''}
          onChange={handleChange}
          placeholder="Description"
          rows={4}
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Location */}
        <input
          name="location"
          value={eventData.location ?? ''}
          onChange={handleChange}
          placeholder="Location"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Date */}
        <input
          type="date"
          name="date"
          value={eventData.date?.split('T')[0] ?? ''}
          onChange={handleChange}
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Start & End Time */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="time"
            name="start_time"
            value={eventData.start_time ?? ''}
            onChange={handleChange}
            className="p-2 bg-gray-900 border border-gray-700 rounded"
          />
          <input
            type="time"
            name="end_time"
            value={eventData.end_time ?? ''}
            onChange={handleChange}
            className="p-2 bg-gray-900 border border-gray-700 rounded"
          />
        </div>

        {/* Genre */}
        <input
          name="genre"
          value={eventData.genre ?? ''}
          onChange={handleChange}
          placeholder="Genre"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Ticket Price (string-coerce) */}
        <input
          name="ticket_price"
          value={`${eventData.ticket_price ?? ''}`}
          onChange={handleChange}
          placeholder="Ticket Price"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Website Link */}
        <input
          name="website_link"
          value={eventData.website_link ?? ''}
          onChange={handleChange}
          placeholder="Website / Ticket Link"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded"
        />

        {/* Poster preview + remove checkbox */}
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

        {/* Upload new poster */}
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1">
            Upload New Poster
          </label>
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
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
      </div>
    </div>
  );
};

export default EditEventPage;
