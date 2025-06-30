import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/Header';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const plans = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: '$7/month',
    description: 'Flexible monthly access. Cancel anytime.',
  },
  {
    id: 'annual',
    name: 'Annual Plan',
    price: '$70/year',
    description: 'Save over 15%! Pay once and stay Pro for a full year.',
  },
];

const features = [
  'Unlimited event submissions with priority placement on the calendar.',
  'Custom artist profile showcasing your music, links and media.',
  'Built‑in tipping so fans can directly support your work.',
  'Early access to upcoming community radio tools and analytics.'
];

const testimonials = [
  {
    quote: 'Alpine Pro helped us reach new venues and grow our audience.',
    author: 'The Summit Trio'
  },
  {
    quote: 'Our bookings doubled after setting up a Pro profile.',
    author: 'DJ Mountain Vibes'
  },
  {
    quote: 'Fans love being able to tip us right from the event page.',
    author: 'Sierra Sounds'
  }
];

export default function UpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth()

  const handleSubscribe = async () => {
  if (!user?.id) return alert('You must be logged in to subscribe.');

  setLoading(true);
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, plan: selectedPlan }),
    });

    console.log('Sending:', { userId: user?.id, plan: selectedPlan });
//debug

    const data = await res.json();

    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      console.error('Stripe session failed:', data.message);
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
      <main className="flex-grow">
        <section className="text-center py-16 px-6 bg-black">
          <h1 className="text-4xl font-extrabold text-gold mb-4">Go Pro on Alpine Groove Guide</h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-300">
            Promote your shows, connect with fans and unlock tools built for Colorado musicians.
          </p>
        </section>

        <section className="py-12 px-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-6">Why Upgrade?</h2>
          <ul className="list-disc list-inside space-y-3 text-left md:text-lg">
            {features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>

        <section className="bg-gray-800 py-12 px-6 text-center">
          <h2 className="text-2xl font-semibold mb-6">Choose Your Plan</h2>
          <div className="flex flex-col items-center">
            <div className="flex gap-4 mb-6">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-4 rounded-lg border transition-all w-44 ${
                    selectedPlan === plan.id
                      ? 'bg-green-600 text-white border-green-400'
                      : 'bg-gray-900 border-gray-600 text-gray-300 hover:border-white'
                  }`}
                >
                  <div className="text-lg font-bold">{plan.name}</div>
                  <div className="text-sm">{plan.price}</div>
                  <div className="text-xs mt-1 opacity-75">{plan.description}</div>
                </button>
              ))}
            </div>

            <button
              onClick={handleSubscribe}
              disabled={loading || !user}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-semibold text-white disabled:opacity-50"
            >
              {loading ? 'Redirecting…' : `Subscribe (${plans.find(p => p.id === selectedPlan)?.price})`}
            </button>
            <p className="mt-4 text-sm text-gray-300">Save over 15% with the annual plan.</p>
          </div>
        </section>

        <section className="py-12 px-6 max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-6">What Artists Are Saying</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <blockquote key={t.author} className="bg-gray-800 p-6 rounded-lg text-left">
                <p className="italic mb-2">&quot;{t.quote}&quot;</p>
                <footer className="text-sm text-gray-400">&mdash; {t.author}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      </main>

      <footer className="text-center text-sm text-gray-500 py-4">
        <Link href="/" className="underline hover:text-gray-300">
          ← Back to Home
        </Link>
      </footer>
    </div>
  );
}
