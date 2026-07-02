import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;


const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const alertRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
      }),
       credentials: 'include',
    });
    const data = await response.json();
    if(!response.ok){
      throw new Error(data.message || "Failed To Submit To User Email");
    }
    setSuccessMessage("If an account exists for that email, we've sent a password reset link."); // Mirrors backend response copy so users know to look for the /reset-password/${token} email link.
    setEmail('');
    return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send reset email.';
      console.error("Forgot password submission failed:", error);
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (successMessage && (alertRef.current || formContainerRef.current)) {
      (alertRef.current ?? formContainerRef.current)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [successMessage]);

  return (
    <>
      <Head>
        <title>Forgot Password – Alpine Groove Guide</title>
      </Head>
      <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_60%)]" />
        <div
          className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4"
          ref={formContainerRef}
        >
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
                Alpine Groove Guide
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Reset your password</h1>
              <p className="text-sm text-slate-400">
                Enter your account email and we&apos;ll send a secure reset link if the account exists.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 text-left shadow-xl shadow-black/40 backdrop-blur-sm sm:p-8"
            >
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                placeholder="you@email.com"
              />
              {successMessage && (
                <div
                  ref={alertRef}
                  role="status"
                  aria-live="polite"
                  className="mt-4 rounded-lg border border-emerald-500/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100"
                >
                  {successMessage}
                </div>
              )}
              {!successMessage && errorMessage && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mt-4 rounded-lg border border-rose-500/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-100"
                >
                  {errorMessage}
                </div>
              )}
              <button
                type="submit"
                className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400">
              Remembered it?{' '}
              <Link href="/LoginPage" className="text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
