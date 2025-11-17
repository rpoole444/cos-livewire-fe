import { useRouter } from 'next/router';
import { useEffect } from 'react';
import RegistrationForm from '@/components/registration';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

const RegisterPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const redirect = router.query.redirect as string;

  useEffect(() => {
    if (user) {
      router.push(redirect || '/');
    }
  }, [user, redirect, router]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <section className="flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center mb-8">
          <Image
            src="/alpine_groove_guide_icon.png"
            alt="Alpine Groove Guide Logo"
            className="mx-auto mb-4 w-20" 
            width={180}
            height={180}
          />
          <h1 className="text-3xl font-extrabold text-gold mb-2">Create an Account</h1>
          <p className="text-gray-300">Register to submit events and join the Colorado Springs music scene.</p>
        </div>
        <div className="bg-white text-black max-w-md w-full p-8 rounded-xl shadow-2xl">
          <RegistrationForm
            setAuthMode={(mode) => {
              if (mode === 'login') router.push('/LoginPage');
            }}
            onSuccess={() => router.push('/LoginPage?redirect=/artist-signup')}
          />
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
