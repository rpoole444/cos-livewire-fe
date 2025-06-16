import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/Header';
import { useState } from 'react';

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.session?.url) {
        window.location.href = data.session.url;
      }
    } catch (err) {
      console.error('Checkout error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Head>
        <title>Upgrade to Alpine Pro | Alpine Groove Guide</title>
      </Head>
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Unlock Alpine Pro</h1>
        <p className="mb-4 max-w-xl">
          Alpine Pro members can create public artist profiles, submit unlimited events, and access exclusive features.
        </p>
        <p className="mb-6 max-w-xl">
          Ready to continue using all Alpine Pro features? Subscribe below and you’ll be redirected to Stripe Checkout.
        </p>
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Redirecting…' : 'Subscribe'}
        </button>
      </main>
      <footer className="text-center text-sm text-gray-500 py-4">
        <Link href="/" className="underline hover:text-gray-300">
          ← Back to Home
        </Link>
      </footer>
    </div>
  );
}
