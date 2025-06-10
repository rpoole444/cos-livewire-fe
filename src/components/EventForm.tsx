import React from 'react';

interface Event {
  title: string;
  description: string;
  location: string;
  date: string;
  start_time: string;
  end_time: string;
  eventType: string;
  genre: string;
  ticketPrice: string;
  customTicketPrice?: string;
  ageRestriction: string;
  website_link: string;
  address: string;
  venue_name: string;
  website: string;
  poster: string | null;
  recurrence: string;
  repeatCount: number;
  posterFile?: File | null;
}

interface Props {
  event: Event;
  index: number;
  locationRef: React.RefObject<HTMLInputElement>;
  onChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onFileChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: (index: number) => void;
  canRemove?: boolean;
}

const EventForm: React.FC<Props> = ({
  event,
  index,
  locationRef,
  onChange,
  onFileChange,
  onRemove,
  canRemove,
}) => {
  return (
    <div className="border border-gray-300 rounded-md p-4 mb-8">
      {canRemove && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            className="text-red-500 underline"
            onClick={() => onRemove && onRemove(index)}
          >
            Remove Event
          </button>
        </div>
      )}
      {/* 📝 Event Info */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Event Info</h2>
        <div className="mb-4">
          <label htmlFor={`title-${index}`} className="block text-sm font-semibold text-gray-800">
            Event Title
          </label>
          <input
            type="text"
            id={`title-${index}`}
            name="title"
            required
            placeholder="e.g. My Band Live"
            value={event.title}
            onChange={(e) => onChange(index, e)}
            className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
          />
        </div>
        <div className="mb-4">
          <label htmlFor={`description-${index}`} className="block text-sm font-semibold text-gray-800">
            Event Description
          </label>
          <textarea
            id={`description-${index}`}
            name="description"
            rows={5}
            required
            placeholder="Tell us about the show, lineup, vibe, etc."
            value={event.description}
            onChange={(e) => onChange(index, e)}
            className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
          ></textarea>
        </div>
        <div className="mb-4">
          <label htmlFor={`location-${index}`} className="block text-sm font-semibold text-gray-800">
            Event Location
          </label>
          <input
            type="text"
            id={`location-${index}`}
            name="location"
            ref={locationRef}
            required
            placeholder="Search venue or address..."
            value={event.location}
            onChange={(e) => onChange(index, e)}
            className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`date-${index}`} className="block text-sm font-semibold text-gray-800">
              Event Date
            </label>
            <input
              type="date"
              id={`date-${index}`}
              name="date"
              required
              value={event.date}
              onChange={(e) => onChange(index, e)}
              className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
            />
            <p className="text-xs text-gray-500 mt-1">All dates are MST (Mountain Standard Time)</p>
          </div>
          <div className="mb-4">
            <label htmlFor={`recurrence-${index}`} className="block text-sm font-semibold text-gray-800">
              Repeat Event
            </label>
            <select
              id={`recurrence-${index}`}
              name="recurrence"
              value={event.recurrence}
              onChange={(e) => onChange(index, e)}
              className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
            >
              <option value="">One-time Event</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            {event.recurrence && (
              <div className="mb-4">
                <label htmlFor={`repeatCount-${index}`} className="block text-sm font-semibold text-gray-800">
                  How many times should it repeat? (Max 4)
                </label>
                <select
                  id={`repeatCount-${index}`}
                  name="repeatCount"
                  value={event.repeatCount || 1}
                  onChange={(e) => onChange(index, e)}
                  className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'time' : 'times'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <label htmlFor={`start_time-${index}`} className="block text-sm font-semibold text-gray-800">
              Start Time
            </label>
            <input
              type="time"
              id={`start_time-${index}`}
              name="start_time"
              required
              value={event.start_time}
              onChange={(e) => onChange(index, e)}
              className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
            />
          </div>
          <div>
            <label htmlFor={`end_time-${index}`} className="block text-sm font-semibold text-gray-800">
              End Time
            </label>
            <input
              type="time"
              id={`end_time-${index}`}
              name="end_time"
              required
              value={event.end_time}
              onChange={(e) => onChange(index, e)}
              className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
            />
          </div>
        </div>
      </div>
      {/* 🎶 Genre */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">🎶 Genre</h2>
        <label htmlFor={`genre-${index}`} className="block text-sm font-semibold text-gray-800">
          Event Genre
        </label>
        <select
          id={`genre-${index}`}
          name="genre"
          required
          value={event.genre}
          onChange={(e) => onChange(index, e)}
          className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
        >
          <option value="">Select Genre</option>
          <option value="Jazz">Jazz</option>
          <option value="Funk">Funk</option>
          <option value="Rock">Rock</option>
          <option value="Soul">Soul</option>
          <option value="Electronic">Electronic</option>
          <option value="Indie">Indie</option>
          <option value="Hip-Hop">Hip-Hop</option>
          <option value="Pop">Pop</option>
          <option value="Blues">Blues</option>
          <option value="Alternative">Alternative</option>
          <option value="Country">Country</option>
          <option value="R&B">R&B</option>
          <option value="Reggae">Reggae</option>
          <option value="Techno">Techno</option>
          <option value="Dance">Dance</option>
          <option value="World">World</option>
          <option value="Other">Other</option>
        </select>
      </div>
      {/* 💵 Ticket Price */}
      <label htmlFor={`ticketPrice-${index}`} className="block text-sm font-semibold text-gray-800">
        Ticket Price / Door Charge
      </label>
      <select
        id={`ticketPrice-${index}`}
        name="ticketPrice"
        value={event.ticketPrice}
        onChange={(e) => onChange(index, e)}
        className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
      >
        <option value="">Select a price</option>
        <option value="Free">Free</option>
        <option value="Donation">Donation</option>
        <option value="Other">Other (Enter custom amount)</option>
        {Array.from(Array(20).keys()).map((i) => (
          <option key={i} value={`${(i + 1) * 5}`}>{`$${(i + 1) * 5}`}</option>
        ))}
      </select>
      {event.ticketPrice === 'Other' && (
        <input
          type="number"
          name="customTicketPrice"
          placeholder="Enter custom amount (e.g. 7.00)"
          value={event.customTicketPrice || ''}
          onChange={(e) => onChange(index, e)}
          min="0"
          step="0.01"
          className="mt-2 p-3 w-full border border-gray-300 rounded-md text-black text-base"
        />
      )}
      {/* 🔞 Age Restriction */}
      <fieldset className="mt-10">
        <legend className="text-xl font-bold text-gray-800 mb-4">🔞 Age Restriction</legend>
        <div className="flex flex-wrap gap-4">
          {['All Ages', '16+', '18+', '21+', '25+'].map((age) => (
            <label key={age} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`age-${age}-${index}`}
                name="ageRestriction"
                value={age}
                onChange={(e) => onChange(index, e)}
                checked={event.ageRestriction === age}
                className="w-5 h-5 text-indigo-600"
              />
              <span className="text-sm text-gray-800">{age}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {/* 🔗 Website / Link */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🔗 Event Link</h2>
        <label htmlFor={`website_link-${index}`} className="block text-sm font-semibold text-gray-800">
          Event / Artist Website or Ticket Link
        </label>
        <input
          type="text"
          id={`website_link-${index}`}
          name="website_link"
          value={event.website_link}
          onChange={(e) => onChange(index, e)}
          placeholder="https://example.com"
          className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
        />
      </div>
      {/* 📸 Poster Upload */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📸 Upload Poster</h2>
        <label htmlFor={`poster-${index}`} className="block text-sm font-semibold text-gray-800">
          Poster File (JPEG, PNG, or PDF)
        </label>
        <p className="text-xs text-gray-500 mt-1">Use a square image for best results.</p>
        <input
          type="file"
          id={`poster-${index}`}
          name="poster"
          accept="image/jpeg,image/png,application/pdf"
          onChange={(e) => onFileChange(index, e)}
          className="mt-1 p-2 w-full border border-gray-300 rounded-md text-black"
        />
      </div>
    </div>
  );
};

export default EventForm;
