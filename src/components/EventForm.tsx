import React, { useEffect, useMemo, useRef } from 'react';

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
  locationRef: React.Ref<HTMLInputElement>;
  onChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onFileChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: (index: number) => void;
  canRemove?: boolean;
}

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30";
// Dedicated class keeps the date/time picker icon bright so users know it opens the native picker.
const dateTimeInputClass = `${inputClass} agg-date-time-input`;
const labelClass = "text-xs font-semibold uppercase tracking-widest text-slate-400";
const helperClass = "mt-1 text-xs text-slate-500";

const EventForm: React.FC<Props> = ({
  event,
  index,
  locationRef,
  onChange,
  onFileChange,
  onRemove,
  canRemove,
}) => {
  const loggedRef = useRef(false);

  useEffect(() => {
    if (!loggedRef.current) {
      console.log("[EventForm] mount", {
        index,
        hasPoster: Boolean(event.poster || event.posterFile),
      });
      loggedRef.current = true;
    }
  }, [event.poster, event.posterFile, index]);

  const ticketOptions = useMemo(() => Array.from(Array(20).keys()).map((i) => (i + 1) * 5), []);

  return (
    <section className="relative rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-xl shadow-slate-950/30 backdrop-blur">
      {canRemove && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onRemove && onRemove(index)}
            className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200 transition hover:border-red-400 hover:bg-red-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
          >
            Remove event
          </button>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Event {index + 1}</p>
          <h3 className="text-2xl font-semibold text-white">Event basics</h3>
          <p className="text-sm text-slate-400">
            Fans skim fast—use a clear title and a vivid description so we can feature it confidently.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor={`title-${index}`} className={labelClass}>
              Event title
            </label>
            <input
              type="text"
              id={`title-${index}`}
              name="title"
              required
              placeholder="e.g. Alpine Groove Jam Night"
              value={event.title}
              onChange={(e) => onChange(index, e)}
              className={inputClass}
            />
            <p className={helperClass}>Keep it short and searchable.</p>
          </div>

          <div>
            <label htmlFor={`description-${index}`} className={labelClass}>
              Description
            </label>
            <textarea
              id={`description-${index}`}
              name="description"
              rows={5}
              required
              placeholder="Share the lineup, vibe, and anything special attendees should know."
              value={event.description}
              onChange={(e) => onChange(index, e)}
              className={`${inputClass} min-h-[140px]`}
            />
            <p className={helperClass}>We&apos;ll show the first 140 characters on cards.</p>
          </div>

          <div>
            <label htmlFor={`genre-${index}`} className={labelClass}>
              Genre
            </label>
            <select
              id={`genre-${index}`}
              name="genre"
              required
              value={event.genre}
              onChange={(e) => onChange(index, e)}
              className={`${inputClass} appearance-none`}
            >
              <option value="">Select genre</option>
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
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label htmlFor={`ticketPrice-${index}`} className={labelClass}>
              Ticket price / door charge
            </label>
            <select
              id={`ticketPrice-${index}`}
              name="ticketPrice"
              value={event.ticketPrice}
              onChange={(e) => onChange(index, e)}
              className={`${inputClass} appearance-none`}
            >
              <option value="">Select a price</option>
              <option value="Free">Free</option>
              <option value="Donation">Donation</option>
              <option value="Other">Other (enter amount)</option>
              {ticketOptions.map((price) => (
                <option key={price} value={`${price}`}>{`$${price}`}</option>
              ))}
            </select>
            <p className={helperClass}>Round to the nearest dollar if possible.</p>
            {event.ticketPrice === "Other" && (
              <input
                type="number"
                min="0"
                step="0.01"
                name="customTicketPrice"
                placeholder="Enter custom amount"
                value={event.customTicketPrice || ""}
                onChange={(e) => onChange(index, e)}
                className={`${inputClass} mt-3`}
              />
            )}
          </div>

          <fieldset>
            <legend className={labelClass}>Age policy</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {["All Ages", "16+", "18+", "21+", "25+"].map((age) => (
                <label
                  key={age}
                  className="flex items-center gap-2 rounded-full border border-slate-700/80 px-3 py-1 text-xs font-semibold text-slate-300"
                >
                  <input
                    type="radio"
                    id={`age-${age}-${index}`}
                    name="ageRestriction"
                    value={age}
                    checked={event.ageRestriction === age}
                    onChange={(e) => onChange(index, e)}
                    className="h-4 w-4 text-emerald-400 focus:ring-emerald-400"
                  />
                  {age}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label htmlFor={`date-${index}`} className={labelClass}>
              Event date
            </label>
            <input
              type="date"
              id={`date-${index}`}
              name="date"
              required
              value={event.date}
              onChange={(e) => onChange(index, e)}
              className={dateTimeInputClass}
            />
            <p className={helperClass}>Dates publish in Mountain Time.</p>
          </div>
          <div>
            <label htmlFor={`recurrence-${index}`} className={labelClass}>
              Repeat event
            </label>
            <select
              id={`recurrence-${index}`}
              name="recurrence"
              value={event.recurrence}
              onChange={(e) => onChange(index, e)}
              className={`${inputClass} appearance-none`}
            >
              <option value="">One-time event</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            {event.recurrence && (
              <div className="mt-3">
                <label htmlFor={`repeatCount-${index}`} className={labelClass}>
                  Repeat count (max 4)
                </label>
                <select
                  id={`repeatCount-${index}`}
                  name="repeatCount"
                  value={event.repeatCount || 1}
                  onChange={(e) => onChange(index, e)}
                  className={`${inputClass} appearance-none mt-1`}
                >
                  {[1, 2, 3, 4].map((count) => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? "time" : "times"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label htmlFor={`start_time-${index}`} className={labelClass}>
              Start time
            </label>
            <input
              type="time"
              id={`start_time-${index}`}
              name="start_time"
              required
              value={event.start_time}
              onChange={(e) => onChange(index, e)}
              className={dateTimeInputClass}
            />
          </div>
          <div>
            <label htmlFor={`end_time-${index}`} className={labelClass}>
              End time
            </label>
            <input
              type="time"
              id={`end_time-${index}`}
              name="end_time"
              required
              value={event.end_time}
              onChange={(e) => onChange(index, e)}
              className={dateTimeInputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor={`location-${index}`} className={labelClass}>
            Venue or address
          </label>
          <input
            type="text"
            id={`location-${index}`}
            name="location"
            ref={locationRef}
            required
            placeholder="Search for a venue, bar, or public space"
            value={event.location}
            onChange={(e) => onChange(index, e)}
            className={inputClass}
          />
          <p className={helperClass}>Start typing to search Google Places.</p>
        </div>

        <div>
          <label htmlFor={`website_link-${index}`} className={labelClass}>
            Ticket or info link
          </label>
          <input
            type="text"
            id={`website_link-${index}`}
            name="website_link"
            value={event.website_link}
            onChange={(e) => onChange(index, e)}
            placeholder="https://"
            className={inputClass}
          />
          <p className={helperClass}>Share the best link for tickets or official info.</p>
        </div>

        <div>
          <label htmlFor={`poster-${index}`} className={labelClass}>
            Poster / flyer
          </label>
          <p className={helperClass}>JPG, PNG, or PDF up to 5MB. Square or vertical art works best.</p>
          <input
            type="file"
            id={`poster-${index}`}
            name="poster"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => onFileChange(index, e)}
            className="mt-2 w-full text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-500/20 file:px-4 file:py-2 file:text-emerald-100 file:font-semibold hover:file:bg-emerald-500/30"
          />
        </div>
      </div>
    </section>
  );
};

export default EventForm;
