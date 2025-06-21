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
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Unlock Alpine Pro</h1>
        <p className="mb-4 max-w-xl">
          Alpine Pro gives you full access to unlimited event submissions, artist features, tipping, and more.
        </p>

        <div className="flex gap-4 mb-6">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`p-4 rounded-lg border transition-all w-44 ${
                selectedPlan === plan.id
                  ? 'bg-green-600 text-white border-green-400'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-white'
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
      </main>

      <footer className="text-center text-sm text-gray-500 py-4">
        <Link href="/" className="underline hover:text-gray-300">
          ← Back to Home
        </Link>
      </footer>
    </div>
  );
}
