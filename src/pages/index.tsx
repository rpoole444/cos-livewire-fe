"use client"
import React, { useState } from 'react';
import LoginForm from '@/components/login';
import WelcomeUser from "@/components/WelcomeUser"; 
import RegistrationForm from '@/components/registration';
import { useAuth } from "@/context/AuthContext";
import Events from "@/components/Events";

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
      <div className="flex flex-1 flex-row">
        <main className="w-3/4 p-24 overflow-auto min-h-screen">
          <h1 className="text-2xl font-bold">Today's Events</h1>
          <Events />
        </main>
        <aside className="w-1/4 flex flex-col bg-white p-4 shadow-lg">
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
