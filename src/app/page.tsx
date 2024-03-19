"use client"
import EventsPage from "@/components/events";
import React, { useState } from 'react';
import LoginForm from '@/components/login'; 
import RegistrationForm from '@/components/registration';


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
      <div className="flex flex-1 flex-row">
        <main className="w-3/4 p-24 overflow-auto min-h-screen">
          <h1 className="text-2xl font-bold">Today's Events</h1>
          <EventsPage />
        </main>
        <aside className="w-1/4 bg-white p-4 shadow-lg">
          {authMode === 'login' ? (
            <>
              <LoginForm />
              <button onClick={() => setAuthMode('register')} className="mt-4 text-blue-500">
                Need an account? Register
              </button>
            </>
          ) : (
            <>
              <RegistrationForm />
              <button onClick={() => setAuthMode('login')} className="mt-4 text-blue-500">
                Already have an account? Login
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};
