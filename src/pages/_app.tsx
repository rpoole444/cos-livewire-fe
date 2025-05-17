import React from 'react';
import { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';

if (typeof window !== 'undefined') {
  window.addEventListener('error', e => {
    /* e.error is the original Error object */
    console.log('🔥 Global error:', e.error?.message);
    console.log(e.error?.stack);
  });
  window.addEventListener('unhandledrejection', e => {
    console.log('🔥 Promise rejection:', e.reason);
  });
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
