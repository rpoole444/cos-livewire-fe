"use client"
import { useAuth } from "../context/AuthContext";
import "../styles/globals.css";
import WelcomeUser from "./WelcomeUser";
import { loginUser } from "../pages/api/route"
import Link from "next/link";
import React, { useState } from "react";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const auth = useAuth();
 if (!auth) {
    // Handle the case where auth is null
    return null;
  }

  const { login } = auth;

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
   const data = await loginUser(email, password);
    
   const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';

   setIsLoggedIn(loggedInStatus);
   login(data.user)
  } catch (err) {
    setErrorMessage("An Error occurred, Please try again.");
  }
};

 if (isLoggedIn) {
    return <WelcomeUser />
  } else {
 
  return (
      <div className=" flex justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-9">
          <h1 className="text-center text-sm md:text-base lg:text-lg p-2 bg-blue-100 text-blue-900 font-semibold rounded-md shadow">
            Login to Submit an<br />
            event to the<br />
            Groove Guide!
          </h1>
          <form className="mt-8 space-y-6" action="#" method="POST" onSubmit={handleLogin}>
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="-space-y-px rounded-md shadow-sm">
              <div className="pb-4">
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(event: any) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {errorMessage && (
              <div className="text-red-500 text-center">
                {errorMessage}
              </div>
            )}

            <div>
              <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
  )};
};

export default LoginForm;