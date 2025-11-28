import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

const PRESET_AMOUNTS = [5, 7, 10, 20, 50];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type SupportTipSectionProps = {
  source: 'profile' | 'public';
  title?: string;
  description?: string;
  buttonLabel?: string;
  className?: string;
  useCredentials?: boolean;
  requireAuth?: boolean;
};

/**
 * Manual QA checklist:
 * - Profile: choose $10 preset, send tip, complete Stripe (test) → redirected with tipSuccess=true → success banner shows once, then clears.
 * - Profile: start checkout then cancel → tipCancelled banner shows.
 * - Profile: enter custom amount (e.g. 13) and confirm Stripe charges that amount.
 * - Public About (logged out): pick $5, send tip, Stripe success → success banner; repeat while logged in.
 */
const SupportTipSection: React.FC<SupportTipSectionProps> = ({
  source,
  title = 'Support Alpine Groove Guide',
  description = 'Help keep Alpine Groove Guide running and discoverable for local artists with a one-time tip.',
  buttonLabel = 'Send a Tip',
  className = '',
  useCredentials = false,
  requireAuth = false,
}) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(7);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTipSuccess, setShowTipSuccess] = useState(false);
  const [showTipCancelled, setShowTipCancelled] = useState(false);

  const customValue = useMemo(() => {
    const parsed = parseFloat(customAmount);
    return Number.isFinite(parsed) ? parsed : NaN;
  }, [customAmount]);
  const customValid = !Number.isNaN(customValue) && customValue >= 1;

  useEffect(() => {
    if (!router.isReady) return;
    const success = router.query.tipSuccess === 'true';
    const cancelled = router.query.tipCancelled === 'true';
    if (success) {
      setShowTipSuccess(true);
      setTimeout(() => setShowTipSuccess(false), 5000);
    }
    if (cancelled) {
      setShowTipCancelled(true);
      setTimeout(() => setShowTipCancelled(false), 5000);
    }
    if (success || cancelled) {
      const nextQuery = { ...router.query };
      delete nextQuery.tipSuccess;
      delete nextQuery.tipCancelled;
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.tipSuccess, router.query.tipCancelled]);

  const effectiveAmount = customValid
    ? Math.round(customValue * 100) / 100
    : selectedPreset ?? null;

  const handleSubmit = async () => {
    if (requireAuth && !loading && !user) {
      router.push(`/LoginPage?redirect=${router.asPath}`);
      return;
    }
    if (!effectiveAmount || effectiveAmount < 1) {
      setError('Enter at least $1 to tip.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/create-tip-session`, {
        method: 'POST',
        credentials: useCredentials ? 'include' : 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: effectiveAmount, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        throw new Error(data?.message || 'Unable to start checkout.');
      }
      window.location.href = data.url;
    } catch (err) {
      console.error('[SupportTipSection] error starting checkout', err);
      setError('Unable to start the tip checkout right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || (requireAuth && !user);

  return (
    <section className={`rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-xl shadow-black/30 ${className}`}>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Support</p>
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-300">{description}</p>
      </div>

      {(showTipSuccess || showTipCancelled) && (
        <div className="mt-3 space-y-2">
          {showTipSuccess && (
            <div className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
              🙌 Thanks for supporting Alpine Groove Guide! Your tip went through.
            </div>
          )}
          {showTipCancelled && (
            <div className="rounded-lg border border-amber-400/60 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
              Tip was cancelled. No charge was made.
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESET_AMOUNTS.map((amt) => {
          const isActive = !customValid && selectedPreset === amt;
          return (
            <button
              key={amt}
              type="button"
              onClick={() => {
                setSelectedPreset(amt);
                setError(null);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'border border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
                  : 'border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-emerald-300 hover:text-emerald-100'
              }`}
            >
              ${amt}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          min={1}
          step={1}
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setError(null);
          }}
          placeholder="Custom amount"
          className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
        />
        <span className="text-sm text-slate-400">$</span>
      </div>

      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled}
          className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold ${
            disabled
              ? 'border border-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0'
          } ${submitting ? 'opacity-80' : ''}`}
        >
          {submitting ? 'Starting checkout…' : buttonLabel}
        </button>
        <p className="text-xs text-slate-500">Powered by Stripe Checkout</p>
      </div>
    </section>
  );
};

export default SupportTipSection;
export { PRESET_AMOUNTS };
