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

  if (!email || !password) {
    setErrorMessage("Please enter both email and password.");
    return;
  }

  try {
    await login(email.toLowerCase(), password);
    router.push(onSuccessRedirect);
  } catch (error: any) {
    const msg =
      (error?.message?.includes("401") || error?.message?.includes("Unauthorized"))
        ? "Invalid email or password."
        : error?.message || "Something went wrong. Please try again.";
    setErrorMessage(msg);
    console.error("Login error:", error);
  }
};

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="rounded-lg border border-rose-500/60 bg-rose-950/40 px-3 py-2 text-xs text-rose-100">
          {errorMessage}
        </div>
      )}
      <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-300 hover:text-emerald-200"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0"
        >
          Sign in
        </button>
      </form>
      <div className="text-right">
        <Link href="/forgot-password" className="text-xs text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline">
          Forgot your password?
        </Link>
      </div>
      {setAuthMode ? (
        <p className="text-center text-xs text-slate-400">
          Need an account?{" "}
          <button
            onClick={() => setAuthMode("register")}
            className="text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
          >
            Register
          </button>
        </p>
      ) : (
        <p className="text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/RegisterPage" className="text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline">
            Create one
          </Link>
        </p>
      )}
    </div>
  );
};

export default LoginForm;
