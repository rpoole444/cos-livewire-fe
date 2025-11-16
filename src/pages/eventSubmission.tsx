import "../styles/globals.css";
import React, { useState, useEffect, useRef } from "react";
import { submitEvent, logoutUser } from "./api/route";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/router";
import Script from "next/script";
import { slugify } from '@/util/slugify'; // Adjust path if needed
import EventForm from '../components/EventForm';
import TrialBanner from '@/components/TrialBanner';
import { isTrialActive } from '@/util/isTrialActive';
import { isActivePro } from '@/util/isActivePro';

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

  const proActive = isActivePro(user as any);
  const trialActive = isTrialActive(user?.trial_ends_at);
  const canAddMultiple = Boolean(proActive || trialActive);
  const trialExpired = user && !proActive && !!user.trial_ends_at && !trialActive;

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

  if (trialExpired) {
    return (
      <div className="container mx-auto p-4 text-center text-white">
        <TrialBanner trial_ends_at={user!.trial_ends_at} />
        <p className="mb-4">Your free trial has expired. Upgrade to Alpine Pro to submit events.</p>
        <Link href="/upgrade" className="text-blue-500 underline">
          Upgrade Now
        </Link>
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="lazyOnload"
        async
        defer
        onLoad={() => events.forEach((_, idx) => initializeAutocomplete(idx))}
      />
      <main className="mx-auto max-w-5xl px-4 py-10 lg:py-14">
        <header className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Submit a live music event</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            {user.first_name}, let&apos;s promote your next show.
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-400">
            Share accurate details so Alpine Groove Guide can feature your event across the calendar and artist pages.
            Include the essentials: when it starts, where to find it, and how fans can support.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <section className="space-y-6">
            <TrialBanner trial_ends_at={user.trial_ends_at} />

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/30">
              <div className="space-y-2 text-sm text-slate-300">
                <p className="font-semibold text-white">Event checklist</p>
                <p className="text-slate-400">
                  Keep promoter-ready details handy: poster art, venue info, and links to tickets or RSVP.
                  Approved events usually go live within 24 hours.
                </p>
              </div>
              <div className="relative mt-8">
                {isSubmitting && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-950/60 backdrop-blur-sm">
                    <svg
                      className="h-10 w-10 animate-spin text-emerald-300"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="w-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:text-white"
                    >
                      + Add another event
                    </button>
                  )}

                  <div className="sticky bottom-4 mt-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 backdrop-blur">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${isSubmitting ? 'opacity-70' : ''}`}
                    >
                      {isSubmitting ? "Submitting…" : events.length > 1 ? "Submit events" : "Submit event"}
                    </button>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <Link
                        href="/"
                        className={`hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200 ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
                      >
                        Cancel &amp; return home
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isSubmitting}
                        className={`text-red-300 hover:text-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Submission tips</p>
            <h2 className="mt-2 text-xl font-semibold text-white">What makes a great listing</h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-300">
              <li>• Upload crisp poster art without text cropped off.</li>
              <li>• Include start and end times so fans can plan the night.</li>
              <li>• Drop a ticket or RSVP link even if it&apos;s just a Facebook event.</li>
              <li>• Mention special guests, rotating DJs, or themed nights in the description.</li>
              <li>• Double-check venue spelling so search works across the site.</li>
            </ul>
            <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-xs text-emerald-100">
              Pro or trial members can add up to four recurring dates at a time. Make sure each date is confirmed before submitting.
            </div>
          </aside>
        </div>
      </main>
    </div>
  ) : (
    <>
      <h1>Please Sign In or Go Back!</h1>
      <Link href='/' className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Go Back</Link>
    </>
  );
};

export default EventSubmission;
