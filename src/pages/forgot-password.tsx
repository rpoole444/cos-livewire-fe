import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;


const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
 const { user, logout} = useAuth();
 const router = useRouter();
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const alertRef = useRef<HTMLDivElement | null>(null);

 const handleLogout = async () => {
    try {  
      // await logoutUser()
        logout()
        router.push('/')
    } catch (err) {
      console.error(err)
    }
  };

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
    console.log("FP response received:", data);
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
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div
        className="flex-grow flex items-center justify-center flex-col px-4 text-center"
        ref={formContainerRef}
      >
        <h1 className='text-xl text-black pb-5'>Send a Reset Password Link to your Email Here!</h1>
        <form onSubmit={handleSubmit} className="bg-white p-8 shadow rounded w-full max-w-md text-left">
          <label htmlFor="email" className="text-sm font-bold text-gray-600 block">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1 text-black"
          />
          {successMessage && (
            <div
              ref={alertRef}
              role="status"
              aria-live="polite"
              className="w-full mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
            >
              {successMessage}
            </div>
          )}
          {!successMessage && errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="w-full mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {errorMessage}
            </div>
          )}
          <button
            type="submit"
            className="w-full mt-4 bg-indigo-600 text-white py-2 rounded disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        </div>
         <div className="bg-white p-4 shadow-inner flex justify-between items-center">
            <Link href="/" className="text-indigo-600 hover:text-indigo-800 transition duration-300 ease-in-out">
              Go Back to Homepage
            </Link>
            <button onClick={handleLogout} className="text-blue-500 hover:text-blue-700 transition duration-300 ease-in-out">
              Logout
            </button>
          </div>
    </div>
  );
};

export default ForgotPassword;
