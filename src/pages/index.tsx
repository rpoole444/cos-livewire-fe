"use client"
import React, { useState } from 'react';
import LoginForm from '@/components/login';
import WelcomeUser from "@/components/WelcomeUser"; 
import RegistrationForm from '@/components/registration';
import { useAuth } from "@/context/AuthContext";
import Events from "@/components/Events";
import EventsCalendar from "@/components/EventsCalendar";

type AuthMode = 'login' | 'register';

type Event = {
  id: number;
  title: string;
  date: string;
  // Add other event properties you need
};

interface HomeProps {
  events: Event[];
}

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { user, logout} = useAuth()

  const switchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
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
              <Events />
            </section>
            <aside className="lg:w-1/3"> {/* This restricts the calendar to 1/3 of the space on large screens */}
              <EventsCalendar />
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
