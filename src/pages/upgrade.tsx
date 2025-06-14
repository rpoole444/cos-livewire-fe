import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/Header';

export default function UpgradePage() {
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
          Stripe checkout is coming soon. In the meantime,{' '}
          <a href="mailto:poole.reid@gmail.com" className="underline text-yellow-300 hover:text-yellow-200">
            contact us
          </a>{' '}
          to upgrade manually.
        </p>
        {/* TODO: Replace with Stripe checkout button */}
        <button
          disabled
          className="bg-gray-700 text-gray-400 px-6 py-3 rounded font-semibold cursor-not-allowed"
        >
          Stripe Checkout Coming Soon
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
