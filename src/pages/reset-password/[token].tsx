import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const ResetPassword: React.FC = () => {
  // Backend reset emails link to /reset-password/${token}, so this Next.js route mirrors that exact path.
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');
    setErrorMessage('');
    
    if (!token || typeof token !== 'string') {
      setErrorMessage('This reset link is invalid or still loading. Please open the link from your email again.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

   // Encode the token to ensure the URL is valid
  const encodedToken = encodeURIComponent(token);

    try {
    setIsSubmitting(true);
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/${encodedToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if(!response.ok){
      throw new Error(data.message || "Something Went Wrong, Try Again!");
    }
    setStatusMessage('Password reset successfully. Redirecting to login…');
    setTimeout(() => router.push('/LoginPage'), 1200);
    return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reset password.';
      console.error("Error resetting password:", error);
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password – Alpine Groove Guide</title>
      </Head>
      <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_60%)]" />
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
                Alpine Groove Guide
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Choose a new password</h1>
              <p className="text-sm text-slate-400">
                Use the same email that received the reset link. Your new password must be at least 8 characters.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-xl shadow-black/40 backdrop-blur-sm sm:p-8"
            >
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
                  Account email
                </label>
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                  placeholder="you@email.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
                  New password
                </label>
                <input
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                  placeholder="At least 8 characters"
                />
              </div>
              {statusMessage && (
                <div role="status" className="rounded-lg border border-emerald-500/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
                  {statusMessage}
                </div>
              )}
              {errorMessage && (
                <div role="alert" className="rounded-lg border border-rose-500/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
                  {errorMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Resetting...' : 'Reset password'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400">
              Need a fresh link?{' '}
              <Link href="/forgot-password" className="text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline">
                Request another reset email
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
