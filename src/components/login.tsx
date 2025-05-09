"use client";

import { useAuth } from "../context/AuthContext";
import "../styles/globals.css";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/router";

interface LoginFormProps {
  setAuthMode?: (mode: string) => void;
  onSuccessRedirect?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  setAuthMode,
  onSuccessRedirect = "/#events",
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { user, login } = useAuth();
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    try {
      await login(email.toLowerCase(), password);
      router.push(onSuccessRedirect);
    } catch (error: any) {
      if (error?.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("An error occurred, please try again.");
      }
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-9">
        <h2 className="text-center text-lg font-semibold text-black">
          Login to Submit an<br />event to the<br />Groove Guide!
        </h2>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold transition duration-150"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold pr-10"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:underline focus:outline-none"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-2 text-center text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="bg-gold text-black px-4 py-2 rounded-md hover:bg-yellow-400 font-semibold w-full transition duration-200 ease-in-out"
            >
              Login
            </button>

            <Link
              href="/forgot-password"
              className="block text-center mt-4 text-sm text-black hover:underline transition"
            >
              Forget your password? Click Here!
            </Link>

            {setAuthMode && (
              <p className="mt-4 text-center text-sm text-black">
                Need an account?{" "}
                <span
                  onClick={() => setAuthMode("register")}
                  className="text-gold font-semibold cursor-pointer hover:underline"
                >
                  Register
                </span>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
