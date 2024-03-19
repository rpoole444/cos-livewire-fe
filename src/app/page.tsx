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
    <div className="flex min-h-screen">
      <main className="flex-grow p-24">
        <h1 className="text-2xl font-bold">Today's Events</h1>
        <EventsPage />
      </main>
      <aside className="w-1/4 bg-white p-4 shadow-lg">
        {authMode === 'login' ? (
          <LoginForm />
        ) : (
          <RegistrationForm />
        )}
        <button onClick={switchAuthMode} className="mt-4 text-blue-500">
          {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </aside>
    </div>
  );
};
