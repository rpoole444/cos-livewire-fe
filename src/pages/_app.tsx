import React            from 'react';
import type { AppProps } from 'next/app';

import { AuthProvider } from '@/context/AuthContext';
import ClientOnly       from '@/components/ClientOnly';
import Header           from '@/components/Header';

import '@/styles/globals.css';

/* optional: simple global loggers */
if (typeof window !== 'undefined') {
  window.addEventListener('error',              e => console.log('🔥 Global ',  e.error));
  window.addEventListener('unhandledrejection', e => console.log('🔥 Promise', e.reason));
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClientOnly>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ClientOnly>
  );
}
