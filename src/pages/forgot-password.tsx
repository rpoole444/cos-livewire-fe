import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';


const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
 const { user, logout} = useAuth();
 const router = useRouter();
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
    try {
    const response = await fetch('https://alpine-groove-guide-be-e5150870a33a.herokuapp.com/api/auth/forgot-password', {
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
    router.push('/')
    return data;
    } catch (error) {
      throw (error instanceof Error) ? error : new Error(String(error));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex-grow flex items-center justify-center flex-col">
        <h1 className='text-xl text-black pb-5'>Send a Reset Password Link to your Email Here!</h1>
        <form onSubmit={handleSubmit} className="bg-white p-8 shadow rounded">
          <label htmlFor="email" className="text-sm font-bold text-gray-600 block">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1 text-black"
          />
          <button
            type="submit"
            className="w-full mt-4 bg-indigo-600 text-white py-2 rounded"
          >
            Send Reset Link
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
