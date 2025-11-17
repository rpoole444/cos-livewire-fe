import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Link from 'next/link';
import LoginForm from '@/components/login';
import { useAuth } from '@/context/AuthContext';

const LoginPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const redirect = router.query.redirect as string;

  useEffect(() => {
    if (user) {
      router.push(redirect || '/#events'); // Go to event section if no redirect
    }
  }, [user, redirect, router]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_60%)]" />
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
              Alpine Groove Guide
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Welcome back</h1>
            <p className="text-sm text-slate-400">
              Sign in to manage shows, artist pages, and your Alpine Pro perks.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-xl shadow-black/40 backdrop-blur-sm sm:p-8">
            <LoginForm />
          </div>
          <p className="text-center text-xs text-slate-500">
            Need help?{" "}
            <Link href="/contact" className="text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
