import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function NewsletterUnsubscribePage() {
  const router = useRouter();
  const token = Array.isArray(router.query.token) ? router.query.token[0] : router.query.token;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Unsubscribing you from platform update emails...');

  useEffect(() => {
    if (!router.isReady || !token) return;

    const unsubscribe = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/newsletter/unsubscribe/${token}`, {
          method: 'POST',
          credentials: 'include',
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || 'Unable to unsubscribe with this link.');
        }
        setStatus('success');
        setMessage(data?.message || 'You have been unsubscribed from platform update emails.');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Unable to unsubscribe with this link.');
      }
    };

    unsubscribe();
  }, [router.isReady, token]);

  return (
    <>
      <Head>
        <title>Unsubscribe - Alpine Groove Guide</title>
      </Head>
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
        <section className="mx-auto max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl shadow-black/30">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-alpine">Email preferences</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-sun-gold">
            {status === 'success' ? 'You are unsubscribed' : status === 'error' ? 'Link problem' : 'One moment'}
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">{message}</p>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Important account, password, booking, claim, and submission emails may still be sent when they are tied to your activity.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-sun-gold px-5 py-2.5 text-sm font-black text-night transition hover:bg-mist"
          >
            Back to Alpine Groove Guide
          </Link>
        </section>
      </main>
    </>
  );
}
