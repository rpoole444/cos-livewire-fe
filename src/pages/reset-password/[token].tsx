import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 shadow rounded">
        <label htmlFor="email" className="text-sm font-bold text-gray-600 block">User Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mt-1 text-black"
        />
        <label htmlFor="password" className="text-sm font-bold text-gray-600 block">New Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mt-1 text-black"
        />
        {statusMessage && (
          <div role="status" className="mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {statusMessage}
          </div>
        )}
        {errorMessage && (
          <div role="alert" className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 bg-indigo-600 text-white py-2 rounded disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
    </>
  );
};

export default ResetPassword;
