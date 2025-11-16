import React            from 'react';
import type { AppProps } from 'next/app';

import { AuthProvider } from '@/context/AuthContext';
import ClientOnly       from '@/components/ClientOnly';
import Layout from '@/components/Layout';
import Router from 'next/router';
import NProgress from 'nprogress';
import '@/styles/globals.css';
import 'nprogress/nprogress.css';

// Optional: Customize NProgress
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.25 });
Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());
/* optional: simple global loggers */
if (typeof window !== 'undefined') {
  window.addEventListener('error',              e => console.log('🔥 Global ',  e.error));
  window.addEventListener('unhandledrejection', e => console.log('🔥 Promise', e.reason));
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClientOnly>
      <AuthProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthProvider>
    </ClientOnly>
  );
}
