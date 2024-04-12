import React, { useState } from 'react';
import { useRouter } from 'next/router';

const ResetPassword: React.FC = () => {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || typeof token !== 'string') {
    console.error('Token is not available or invalid.');
    return;
  }

   // Encode the token to ensure the URL is valid
  const encodedToken = encodeURIComponent(token);

    try {
    const response = await fetch(`http://localhost:3000/api/auth/reset-password/${encodedToken}`, {
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
    console.log("Password Reset Succesfully:", data);
    router.push("/")
    return data;
    } catch (error) {
    console.error("Error resetting password:", error)
    }
  };

  return (
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
        <button
          type="submit"
          className="w-full mt-4 bg-indigo-600 text-white py-2 rounded"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
