import React from 'react';
import { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';

import ClientOnly        from '@/components/ClientOnly';
import Header            from '@/components/Header';   // persistent, needs user

import '@/styles/globals.css';

/* simple global logging – optional */
if (typeof window !== 'undefined') {
  window.addEventListener('error',               e => console.log('🔥 Global',   e.error));
  window.addEventListener('unhandledrejection',  e => console.log('🔥 Promise',  e.reason));
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      {/* browser-only, persistent UI */}
      <ClientOnly>
        <Header />
        {/* <ToastContainer />  if you have one */}
      </ClientOnly>

      {/* every routed page */}
      <Component {...pageProps} />
    </AuthProvider>
  );
}

