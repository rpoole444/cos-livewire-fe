import React, { useState } from 'react';
import LoginForm from '@/components/login'; 
import RegistrationForm from '@/components/registration';

type AuthMode = 'login' | 'register';

const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const switchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      {authMode === 'login' ? (
        <LoginForm />
      ) : (
        <RegistrationForm />
      )}
      <button onClick={switchAuthMode} className="mt-4 text-blue-500">
        {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
    </div>
  );
};

export default AuthPage;