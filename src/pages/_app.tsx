import React            from 'react';
import Head from 'next/head';
import type { AppProps } from 'next/app';

import { AuthProvider } from '@/context/AuthContext';
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

const NOINDEX_PREFIXES = [
  '/admin',
  '/AdminService',
  '/AdminUsersPage',
  '/EditEventPage',
  '/LoginPage',
  '/RegisterPage',
  '/UserProfile',
  '/artist-signup',
  '/artists/edit',
  '/embed',
  '/events/edit',
  '/forgot-password',
  '/profile',
  '/reset-password',
  '/unsubscribe',
  '/upgrade',
  '/venue-signup',
];

const shouldNoindexRoute = (pathname: string) =>
  NOINDEX_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export default function MyApp({ Component, pageProps, router }: AppProps) {
  const isEmbedRoute = router.pathname.startsWith('/embed/');

  if (isEmbedRoute) {
    return <Component {...pageProps} />;
  }

  return (
    <AuthProvider>
      <Layout>
        <Head>
          <title>Alpine Groove Guide</title>
          {shouldNoindexRoute(router.pathname) && (
            <meta name="robots" content="noindex,nofollow" />
          )}
        </Head>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
