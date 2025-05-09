import { useRouter } from 'next/router';
import { useEffect } from 'react';
import RegistrationForm from '@/components/registration';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';

const RegisterPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const redirect = router.query.redirect as string;

  useEffect(() => {
    if (user) {
      router.push(redirect || '/');
    }
  }, [user, redirect]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <section className="flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center mb-8">
          <img
            src="/alpine_groove_guide_icon.png"
            alt="Alpine Groove Guide Logo"
            className="mx-auto mb-4 w-20"
          />
          <h1 className="text-3xl font-extrabold text-gold mb-2">Create an Account</h1>
          <p className="text-gray-300">Register to submit events and join the Colorado Springs music scene.</p>
        </div>
        <div className="bg-white text-black max-w-md w-full p-8 rounded-xl shadow-2xl">
          <RegistrationForm
            setAuthMode={(mode) => {
              if (mode === 'login') router.push('/LoginPage');
            }}
          />
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
