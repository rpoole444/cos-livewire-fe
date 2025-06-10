import "../styles/globals.css";
import React, { useState, useEffect, useRef } from "react";
import { submitEvent, logoutUser } from "./api/route";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/router";
import Script from "next/script";
import { slugify } from '@/util/slugify'; // Adjust path if needed
import dayjs from 'dayjs';
import EventForm from '../components/EventForm';

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


const EventSubmission = () => {
  const initialEvent: Event = {
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
    poster: '',
    recurrence: '',
    repeatCount: 1,
    customTicketPrice: '',
    posterFile: null,
  };

  const [events, setEvents] = useState<Event[]>([initialEvent]);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const locationInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isPro = user?.is_pro;
  const isTrialActive = user?.trial_ends_at ? dayjs().isBefore(dayjs(user.trial_ends_at)) : false;
  const canAddMultiple = Boolean(isPro || isTrialActive);

  const addEvent = () => setEvents((prev) => [...prev, { ...initialEvent }]);
  const removeEvent = (index: number) =>
    setEvents((prev) => prev.filter((_, i) => i !== index));

  useEffect(() => {
    if (window.google) {
      events.forEach((_, idx) => initializeAutocomplete(idx));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/LoginPage?redirect=/eventSubmission');
    }
  }, [user, router]);

const initializeAutocomplete = (index: number) => {
  if (
    typeof window !== 'undefined' &&
    window.google?.maps?.places?.Autocomplete &&
    locationInputRefs.current[index] instanceof HTMLInputElement
  ) {
    const autocomplete = new window.google.maps.places.Autocomplete(locationInputRefs.current[index]!);
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      setEvents((prev) =>
        prev.map((ev, i) =>
          i === index
            ? {
                ...ev,
                location: place.formatted_address || '',
                venue_name: place.name || '',
                website: place.website || '',
                address: place.formatted_address || '',
              }
            : ev
        )
      );
    });
  }
};

useEffect(() => {
  if (window.google) {
    events.forEach((_, idx) => initializeAutocomplete(idx));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [events.length]);


const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
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

    setEvents((prev) => prev.map((ev, i) => (i === index ? { ...ev, posterFile: selectedFile } : ev)));
  }
};

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEvents((prev) => prev.map((ev, i) => (i === index ? { ...ev, [name]: value } : ev)));
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

    for (const ev of events) {
      let ticketPriceValue = ev.ticketPrice;
      if (ticketPriceValue === 'Other' && ev.customTicketPrice?.trim()) {
        ticketPriceValue = ev.customTicketPrice.trim();
      } else if (ticketPriceValue === 'Free' || ticketPriceValue === 'Donation') {
        ticketPriceValue = ticketPriceValue;
      } else {
        ticketPriceValue = `$${ticketPriceValue}`;
      }

      const count = Math.min(ev.repeatCount || 1, 4);
      const recurrenceDates = ev.recurrence
        ? generateRecurringDates(ev.date, ev.recurrence, count)
        : [ev.date];

      const fullSlug = `${slugify(ev.title)}-${Date.now().toString(36)}`;

      const formData = new FormData();
      formData.append('user_id', user.id.toString());
      formData.append('title', ev.title);
      formData.append('description', ev.description);
      formData.append('location', ev.location);
      formData.append('address', ev.address);
      formData.append('start_time', ev.start_time);
      formData.append('end_time', ev.end_time);
      formData.append('genre', ev.genre);
      formData.append('ticket_price', ticketPriceValue);
      formData.append('age_restriction', ev.ageRestriction);
      formData.append(
        'website_link',
        ev.website_link.startsWith('http') ? ev.website_link : `http://${ev.website_link}`
      );
      formData.append('venue_name', ev.venue_name);
      formData.append('website', ev.website);
      formData.append('recurrenceDates', JSON.stringify(recurrenceDates));
      formData.append('slug', fullSlug);

      if (ev.posterFile) {
        formData.append('poster', ev.posterFile);
      }

      const res = await submitEvent(formData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit event');
      }
    }

    setSubmissionSuccess(true);
    setTimeout(() => {
      router.push(`/`);
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
        onLoad={() => events.forEach((_, idx) => initializeAutocomplete(idx))}
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
          {events.map((event, idx) => (
            <EventForm
              key={idx}
              event={event}
              index={idx}
              locationRef={(el: HTMLInputElement | null) => {
                locationInputRefs.current[idx] = el;
              }}
              onChange={handleChange}
              onFileChange={handleFileChange}
              onRemove={removeEvent}
              canRemove={canAddMultiple && events.length > 1}
            />
          ))}
          {canAddMultiple && (
            <button
              type="button"
              onClick={addEvent}
              className="text-blue-600 underline"
            >
              Add Another Event
            </button>
          )}

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`relative bg-indigo-600 text-white font-semibold py-3 px-6 rounded-md shadow-lg transition ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none" viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Submitting…
                </>
              ) : (
                `${events.length > 1 ? 'Submit Events' : 'Submit Event'}`
              )}
            </button>

            <Link
              href="/"
              className={`text-indigo-600 font-medium underline ${isSubmitting ? 'pointer-events-none opacity-40' : 'hover:text-indigo-800'}`}
            >
              Back to Homepage
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isSubmitting}
              className={`text-red-500 hover:underline mt-2 sm:mt-0 ${isSubmitting && 'opacity-40 cursor-not-allowed'}`}
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
