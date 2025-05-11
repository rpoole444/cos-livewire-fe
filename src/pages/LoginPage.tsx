import { useRouter } from 'next/router';
import { useEffect } from 'react';
import LoginForm from '@/components/login';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

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
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <section className="flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center mb-8">
          <Image
            src="/alpine_groove_guide_icon.png"
            alt="Alpine Groove Guide Logo"
            className="mx-auto mb-4 w-20"
          />
          <h1 className="text-3xl font-extrabold text-gold mb-2">Welcome Back</h1>
          <p className="text-gray-300">
            Log in to submit events and explore your dashboard.
          </p>
        </div>
        <div className="bg-white text-black max-w-md w-full p-8 rounded-xl shadow-2xl">
          <LoginForm
            setAuthMode={(mode) => {
              if (mode === 'register') router.push('/RegisterPage');
            }}
          />
        </div>
      </section>
    </div>
  );
};

export default LoginPage;

