"use client";

import "../styles/globals.css";
import React, { useState } from "react";
import { registerUser } from "@/pages/api/route";

const genreOptions = [
  "Jazz",
  "Blues",
  "Funk",
  "Indie",
  "Dance",
  "Electronic",
  "Rock",
  "Alternative",
  "Country",
  "Hip-Hop",
  "Pop",
  "R&B",
  "Rap",
  "Reggae",
  "Soul",
  "Techno",
  "World",
  "Other",
];

interface RegistrationProps {
  setAuthMode: (mode: string) => void;
  onSuccess?: () => void;
}

const RegistrationForm: React.FC<RegistrationProps> = ({ setAuthMode, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePassword = (pw: string): string => {
    if (pw.length < 8) return "Password must be at least 8 characters.";
    if (!/[a-z]/.test(pw)) return "Include at least one lowercase letter.";
    if (!/[A-Z]/.test(pw)) return "Include at least one uppercase letter.";
    if (!/\d/.test(pw)) return "Include at least one number.";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(pw)) return "Include at least one special character.";
    return "";
  };

  const handleGenreChange = (genre: string) => {
    setGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : prev.length < 3
        ? [...prev, genre]
        : prev,
    );
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser(firstName, lastName, displayName, email, password, description, genres);
      setRegistrationSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          setAuthMode("login");
        }
        setRegistrationSuccess(false);
      }, 2500);
    } catch (error: any) {
      setErrorMessage(error?.message || "There was an error registering.");
    } finally {
      setPasswordStrength("");
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="space-y-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center text-sm text-emerald-100">
        <p className="text-base font-semibold text-emerald-300">Registration successful!</p>
        <p className="text-xs text-emerald-200">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleRegister}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="first-name" className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
            First name
          </label>
          <input
            id="first-name"
            name="first-name"
            type="text"
            autoComplete="given-name"
            required
            className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
            placeholder="Your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="last-name" className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
            Last name
          </label>
          <input
            id="last-name"
            name="last-name"
            type="text"
            autoComplete="family-name"
            required
            className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
            placeholder="Your last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="display-name" className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
          Display name
        </label>
        <input
          id="display-name"
          name="display-name"
          type="text"
          required
          className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
          placeholder="Band or artist name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

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
    <label htmlFor="description" className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
      About you
    </label>
    <textarea
      id="description"
      name="description"
      rows={3}
      className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
      placeholder="Describe your sound, instruments, or role"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
    />
  </div>

  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium uppercase tracking-[0.12em] text-slate-300">
        Top genres (pick up to 3)
      </label>
      <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{genres.length}/3</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {genreOptions.map((genre) => {
        const selected = genres.includes(genre);
        return (
          <button
            type="button"
            key={genre}
            onClick={() => handleGenreChange(genre)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              selected
                ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-emerald-400/60"
            }`}
          >
            {genre}
          </button>
        );
      })}
    </div>
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
            autoComplete="new-password"
            required
            className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => {
              const value = e.target.value;
              setPassword(value);
              const validationMsg = validatePassword(value);
              setPasswordStrength(validationMsg || "Strong");
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          At least 8 characters with uppercase, lowercase, numbers, and a special symbol.
        </p>
        {passwordStrength && (
          <p className={`text-xs ${passwordStrength === "Strong" ? "text-emerald-300" : "text-rose-300"}`}>
            {passwordStrength}
          </p>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/60 bg-rose-950/40 px-3 py-2 text-xs text-rose-100">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0 disabled:opacity-70"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-xs text-slate-400">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => setAuthMode("login")}
          className="text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
        >
          Log in
        </button>
      </p>
    </form>
  );
};

export default RegistrationForm;
