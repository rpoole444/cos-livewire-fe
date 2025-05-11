// pages/404.tsx
import Link from 'next/link';
import Head from 'next/head';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | Alpine Groove Guide</title>
      </Head>
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white text-center px-6">
        <h1 className="text-6xl font-bold mb-4 text-gold">404</h1>
        <p className="text-xl mb-6">Oops... that page doesn’t exist.</p>
        <Link href="/" passHref>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md transition hover:scale-105">
            Back to Home
          </button>
        </Link>
      </div>
    </>
  );
}
