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
import isBetween from 'dayjs/plugin/isBetween';

type AuthMode = 'login' | 'register';
dayjs.extend(isBetween)
export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filterMode, setFilterMode] = useState<'day' | 'week' | 'all'>('day');

  const { user, logout } = useAuth();

  const switchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsData = await getEvents();
        const approvedEvents = eventsData
          .filter((activity: any) => activity.is_approved)
          .sort((a: any, b: any) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          });
        setEvents(approvedEvents);
      } catch (error) {
        console.error('Failed to load events', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const updateFilteredEvents = () => {
      let filtered :any  = [];
      if (filterMode === 'day') {
        filtered = events.filter((event) =>
          dayjs(event.date).isSame(selectedDate, 'day')
        );
      } else if (filterMode === 'week') {
        const startOfWeek = selectedDate.startOf('week');
        const endOfWeek = selectedDate.endOf('week');
        filtered = events.filter((event) =>
          dayjs(event.date).isBetween(startOfWeek, endOfWeek, null, '[]')
        );
      } else if (filterMode === 'all') {
        filtered = events;
      }
      setFilteredEvents(filtered);
    };
    updateFilteredEvents();
  }, [events, selectedDate, filterMode]);

  const handleDateSelect = (newDate: any) => {
    setSelectedDate(newDate);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterMode(event.target.value as 'day' | 'week' | 'all');
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
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Events</h1>
                <select
                  value={filterMode}
                  onChange={handleFilterChange}
                  className="p-2 border rounded text-black"
                >
                  <option value="day">Today's Events</option>
                  <option value="week">This Week's Events</option>
                  <option value="all">All Upcoming Events</option>
                </select>
              </div>
              <EventsCalendar currentDate={selectedDate} events={events} onDateSelect={handleDateSelect} />
              <section className="flex-grow">
                <Events events={filteredEvents} />
              </section>
            </div>
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
                  <RegistrationForm setAuthMode={switchAuthMode} />
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
}