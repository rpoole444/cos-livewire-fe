import "../styles/globals.css";
import React, { useState, useEffect, useRef } from "react";
import { submitEvent, logoutUser } from "./api/route";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/router";
import Script from "next/script";
import { slugify } from '@/util/slugify'; // Adjust path if needed

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
}


const EventSubmission = () => {
  const [eventData, setEventData] = useState<Event>({
    title: '',
    description: '',
    location: '',
    date: '',
    start_time: '',
    end_time: '',
    eventType: '',
    genre: '',
    ticketPrice: '',
    ageRestriction: '',
    website_link: '',
    address: '',
    venue_name: '', 
    website: '', 
    poster: '' , 
    recurrence:'',
    repeatCount: 1,
    customTicketPrice: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (window.google) {
      initializeAutocomplete();
    }
  }, []);

  useEffect(() => {
  if (!user) {
    router.push('/LoginPage?redirect=/eventSubmission');
  }
}, [user, router]);

const initializeAutocomplete = () => {
  if (
    typeof window !== 'undefined' &&
    window.google?.maps?.places?.Autocomplete &&
    locationInputRef.current instanceof HTMLInputElement
  ) {
    const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current);
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      setEventData((prevState) => ({
        ...prevState,
        location: place.formatted_address || '',
        venue_name: place.name || '',
        website: place.website || '',
        address: place.formatted_address || '',
      }));
    });
  }
};


const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
    const selectedFile = e.target.files[0];
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (!validTypes.includes(selectedFile.type)) {
      alert("Invalid file type. Only JPG, PNG, or PDF files are allowed.");
      return;
    }

    if (selectedFile.size > maxSizeBytes) {
      alert(`File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`);
      return;
    }

    setFile(selectedFile);
  }
};


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEventData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleLogout = async () => {
    try {
      logout();
      router.push('/');
    } catch (err) {
      console.error(err);
    }
  };

 const getNthWeekdayOfMonth = (year: number, month: number, weekday: number, nth: number): Date | null => {
  const firstOfMonth = new Date(year, month, 1);
  let count = 0;

  for (let day = 1; day <= 31; day++) {
    const date = new Date(year, month, day);
    if (date.getMonth() !== month) break;
    if (date.getDay() === weekday) {
      count++;
      if (count === nth) return date;
    }
  }
  return null;
};

const getWeekdayOccurrence = (date: Date): number => {
  const day = date.getDate();
  return Math.floor((day - 1) / 7) + 1;
};

const generateRecurringDates = (startDateStr: string, frequency: string, count = 4): string[] => {
  const result: string[] = [];
  const startDate = new Date(startDateStr);

  if (frequency === 'weekly') {
    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i * 7);
      result.push(date.toISOString().split("T")[0]);
    }
  } else if (frequency === 'monthly') {
    const weekday = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const nth = getWeekdayOccurrence(startDate);

    for (let i = 0; i < count; i++) {
      const year = startDate.getFullYear();
      const month = startDate.getMonth() + i;
      const recurringDate = getNthWeekdayOfMonth(year, month, weekday, nth);
      if (recurringDate) {
        result.push(recurringDate.toISOString().split("T")[0]);
      }
    }
  }

  return result;
};



const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  if (!user) {
    console.error('No user logged in');
    return;
  }
  
  try {
    setIsSubmitting(true); 
    let ticketPriceValue = eventData.ticketPrice;
    
    // Use custom ticket price if "Other" is selected
    if (ticketPriceValue === 'Other' && eventData.customTicketPrice?.trim()) {
      ticketPriceValue = eventData.customTicketPrice.trim();
    } else if (ticketPriceValue === 'Free' || ticketPriceValue === 'Donation') {
      ticketPriceValue = ticketPriceValue;
    } else {
      ticketPriceValue = `$${ticketPriceValue}`;
    }
    
    
    const count = Math.min(eventData.repeatCount || 1, 4); // Limit to 4
    const recurrenceDates = eventData.recurrence
    ? generateRecurringDates(eventData.date, eventData.recurrence, count)
    : [eventData.date];
    
    const fullSlug = `${slugify(eventData.title)}-${Date.now().toString(36)}`;
    
    const formData = new FormData();
    formData.append('user_id', user.id.toString());
    formData.append('title', eventData.title);
    formData.append('description', eventData.description);
    formData.append('location', eventData.location);
    formData.append('address', eventData.address);
    formData.append('start_time', eventData.start_time);
    formData.append('end_time', eventData.end_time);
    formData.append('genre', eventData.genre);
    formData.append('ticket_price', ticketPriceValue);
    formData.append('age_restriction', eventData.ageRestriction);
    formData.append(
      'website_link',
      eventData.website_link.startsWith('http')
        ? eventData.website_link
        : `http://${eventData.website_link}`
    );
    formData.append('venue_name', eventData.venue_name);
    formData.append('website', eventData.website);
    formData.append('recurrenceDates', JSON.stringify(recurrenceDates)); // ✅ new key
    formData.append('slug', fullSlug);

    if (file) {
      formData.append('poster', file);
    }

    const res = await submitEvent(formData);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to submit event');
    }

    setSubmissionSuccess(true);
    setTimeout(() => {
      router.push(`/`); // ✅ Redirect to slug route
      setSubmissionSuccess(false);
    }, 3000);
  } catch (error) {
    console.error('There was an error submitting the event:', error);
  } finally {
    setIsSubmitting(false);         
  }
};



if (!user) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
      <div className="text-center">
        <svg
          className="animate-spin h-8 w-8 mx-auto text-indigo-600 mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          ></path>
        </svg>
        <p className="text-lg font-medium">Checking authentication...</p>
      </div>
    </div>
  );
}


  if (submissionSuccess) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-center text-2xl font-bold mb-6">
        ✅ Your event has been submitted!
        <br />
        You&apos;ll receive an email when it&apos;s approved and live on the calendar.
        </h1>
      </div>
    );
  }

  return user ? (
    <div className="container mx-auto p-4">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="lazyOnload"
        async
        defer
        onLoad={() => initializeAutocomplete()}
      />
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">{user.first_name}, Let&apos;s get your event out there!!</h1>
        <p className="text-md mt-2">Fill out our Submission Form!</p>
      </div>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 relative">
        <p className="text-gray-700 text-base mb-4">
          Please fill out the form below with your event details.
          Make sure to include all required fields so we can add your event to our online calendar and help you promote your event!!
        </p>
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-md z-10">
            <svg className="animate-spin h-10 w-10 text-indigo-600"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-6 w-full max-w-2xl mx-auto space-y-6">
          {/* 📝 Event Info */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Event Info</h2>

            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-800">Event Title</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                placeholder={`e.g. ${user?.displayName ?? ''} Live at the Funk Summit`}
                onChange={handleChange}
                className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-800">Event Description</label>
              <textarea
                id="description"
                name="description"
                rows={5}
                required
                placeholder="Tell us about the show, lineup, vibe, etc."
                onChange={handleChange}
                className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
              ></textarea>
            </div>

            <div className="mb-4">
              <label htmlFor="location" className="block text-sm font-semibold text-gray-800">Event Location</label>
              <input
                type="text"
                id="location"
                name="location"
                ref={locationInputRef}
                required
                placeholder="Search venue or address..."
                onChange={handleChange}
                className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-gray-800">Event Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  onChange={handleChange}
                  className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
                />
                <p className="text-xs text-gray-500 mt-1">All dates are MST (Mountain Standard Time)</p>
              </div>

              <div className="mb-4">
                <label htmlFor="recurrence" className="block text-sm font-semibold text-gray-800">Repeat Event</label>
                <select
                  id="recurrence"
                  name="recurrence"
                  onChange={handleChange}
                  className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
                >
                  <option value="">One-time Event</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                {eventData.recurrence && (
                  <div className="mb-4">
                    <label htmlFor="repeatCount" className="block text-sm font-semibold text-gray-800">
                      How many times should it repeat? (Max 4)
                    </label>
                    <select
                      id="repeatCount"
                      name="repeatCount"
                      value={eventData.repeatCount || 1}
                      onChange={(e) =>
                        setEventData((prev) => ({
                          ...prev,
                          repeatCount: Math.min(4, parseInt(e.target.value, 10)),
                        }))
                      }
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
                <label htmlFor="start_time" className="block text-sm font-semibold text-gray-800">Start Time</label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  required
                  onChange={handleChange}
                  className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
                />
              </div>

              <div>
                <label htmlFor="end_time" className="block text-sm font-semibold text-gray-800">End Time</label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  required
                  onChange={handleChange}
                  className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
                />
              </div>
            </div>
          </div>

          {/* 🎶 Genre */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">🎶 Genre</h2>
            <label htmlFor="genre" className="block text-sm font-semibold text-gray-800">Event Genre</label>
            <select
              id="genre"
              name="genre"
              required
              onChange={handleChange}
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
          <label htmlFor="ticketPrice" className="block text-sm font-semibold text-gray-800">
              Ticket Price / Door Charge
            </label>
            <select
              id="ticketPrice"
              name="ticketPrice"
              value={eventData.ticketPrice}
              onChange={handleChange}
              className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
            >
              <option value="">Select a price</option>
              <option value="Free">Free</option>
              <option value="Donation">Donation</option>
              <option value="Other">Other (Enter custom amount)</option>
              {Array.from(Array(20).keys()).map(i => (
                <option key={i} value={`${(i + 1) * 5}`}>${(i + 1) * 5}</option>
              ))}
            </select>

            {eventData.ticketPrice === 'Other' && (
              <input
                type="number"
                name="customTicketPrice"
                placeholder="Enter custom amount (e.g. 7.00)"
                value={eventData.customTicketPrice || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-2 p-3 w-full border border-gray-300 rounded-md text-black text-base"
              />
            )}


          {/* 🔞 Age Restriction */}
        <fieldset className="mt-10">
          <legend className="text-xl font-bold text-gray-800 mb-4">🔞 Age Restriction</legend>
          <div className="flex flex-wrap gap-4">
            {["All Ages", "16+", "18+", "21+", "25+"].map(age => (
              <label key={age} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`age-${age}`}
                  name="ageRestriction"
                  value={age}
                  onChange={handleChange}
                  checked={eventData.ageRestriction === age}
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
            <label htmlFor="website_link" className="block text-sm font-semibold text-gray-800">Event / Artist Website or Ticket Link</label>
            <input
              type="text"
              id="website_link"
              name="website_link"
              onChange={handleChange}
              placeholder="https://example.com"
              className="mt-1 p-3 w-full border border-gray-300 rounded-md text-black text-base"
            />
          </div>

          {/* 📸 Poster Upload */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📸 Upload Poster</h2>
            <label htmlFor="poster" className="block text-sm font-semibold text-gray-800">Poster File (JPEG, PNG, or PDF)</label>
            <input
              type="file"
              id="poster"
              name="poster"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md text-black"
            />
          </div>

          {/* ✅ Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`relative bg-indigo-600 text-white font-semibold py-3 px-6 rounded-md shadow-lg transition
                        ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-2 inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Submitting…
              </>
            ) : (
              'Submit Event'
            )}
          </button>


            <Link
              href="/"
              className={`text-indigo-600 font-medium underline
                          ${isSubmitting ? 'pointer-events-none opacity-40' : 'hover:text-indigo-800'}`}
            >
              Back to Homepage
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isSubmitting}
              className={`text-red-500 hover:underline mt-2 sm:mt-0
                          ${isSubmitting && 'opacity-40 cursor-not-allowed'}`}
            >
              Logout
            </button>

          </div>
        </form>

      </div>
    </div>
  ) : (
    <>
      <h1>Please Sign In or Go Back!</h1>
      <Link href='/' className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Go Back</Link>
    </>
  );
};

export default EventSubmission;
