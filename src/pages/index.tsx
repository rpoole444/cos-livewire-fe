"use client"
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import LoginForm from '@/components/login';
import WelcomeUser from "@/components/WelcomeUser"; 
import RegistrationForm from '@/components/registration';
import { useAuth } from "@/context/AuthContext";
import Events from "../components/events";
import EventsCalendar from "@/components/EventsCalendar";
import { getEvents } from './api/route';
import { Event } from '@/interfaces/interfaces';

type AuthMode = 'login' | 'register';

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  const { user, logout} = useAuth()

  const switchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
};

useEffect(() => {
    const fetchData = async () => {
      try {
        // Assume `getEvents` is your API call function that returns a list of event objects
        const eventsData = await getEvents();
       const approvedEvents = eventsData
          .filter((activity:any) => activity.is_approved)
          .sort((a:any, b:any) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          })
        setEvents(approvedEvents);
      } catch (error) {
        console.error('Failed to load events', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // This effect runs whenever `events` or `selectedDate` changes.
    const updateFilteredEvents = () => {
      const eventsForSelectedDate = events.filter((event) =>
        dayjs(event.date).isSame(selectedDate, 'day')
      );

      if (eventsForSelectedDate.length === 0) {
          setFilteredEvents([]);
        } else {
          setFilteredEvents(eventsForSelectedDate);
        }
      }
    updateFilteredEvents();
  }, [events, selectedDate]);

const handleDateSelect = (newDate:any) => {
  setSelectedDate(newDate);
 };

   return (
    <div className="flex min-h-screen flex-col">
      <header className="w-full bg-indigo-800 text-white p-6">
        <h1 className="text-center text-4xl lg:text-5xl font-bold tracking-tight">
          Alpine Groove Guide
        </h1>
      </header>
      <div className="flex flex-1">
        <main className="flex-grow p-8">
          <div className="flex flex-col lg:flex-row">
            <section className="flex-grow">
              <h1 className="text-2xl font-bold">Today's Events</h1>
              <Events events={filteredEvents} />
            </section>
            <aside className="lg:w-1/3"> {/* This restricts the calendar to 1/3 of the space on large screens */}
              <EventsCalendar currentDate={selectedDate} events={events} onDateSelect={handleDateSelect}/>
            </aside>

          </div>
        </main>
        <aside className="w-1/5 flex flex-col bg-white p-4 shadow-lg">
          {user ? (
            <WelcomeUser />
          ) : (
            <>
              {authMode === 'login' ? (
                <>
                  <LoginForm />
                  <button onClick={() => setAuthMode('register')} className="mt-4 text-blue-500">
                    Need an account? Register
                  </button>
                </>
              ) : (
                <>
                  <RegistrationForm setAuthMode={switchAuthMode}/>
                  <button onClick={() => setAuthMode('login')} className="mt-4 text-blue-500">
                    Already have an account? Login
                  </button>
                </>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
};
