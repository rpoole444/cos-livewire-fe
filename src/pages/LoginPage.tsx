import { useRouter } from 'next/router';
import { useEffect } from 'react';
import LoginForm from '@/components/login';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';

const LoginPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const redirect = router.query.redirect as string;

  useEffect(() => {
    if (user && redirect) {
      router.push(redirect);
    }
  }, [user, redirect]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="flex justify-center items-center py-20">
        <LoginForm setAuthMode={() => {}} />
      </div>
    </div>
  );
};

export default LoginPage;
