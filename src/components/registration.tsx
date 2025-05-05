"use client"
import "../styles/globals.css";
import React, { useState } from 'react';
import { registerUser } from "@/pages/api/route";

const genreOptions = ["Jazz", "Blues", "Funk", "Indie", "Dance", "Electronic","Rock", "Alternative", "Country", "Hip-Hop", "Pop", 
  "R&B", "Rap", "Reggae", "Soul", "Techno", "World", "Other"];

const RegistrationForm: React.FC<{ setAuthMode: (mode: string) => void }> = ({ setAuthMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleGenreChange = (genre: string) => {
    setGenres(prevGenres =>
      prevGenres.includes(genre)
        ? prevGenres.filter(g => g !== genre)
        : prevGenres.length < 3
        ? [...prevGenres, genre]
        : prevGenres
    );
  };

const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setErrorMessage(''); // Clear previous error messages

  if (!validatePassword(password)) {
    setErrorMessage("Password must be at least 8 characters long and include a mix of uppercase letters, lowercase letters, numbers, and special characters.");
    return;
  }

  try {
    await registerUser(firstName, lastName, email, password, description, genres); 
    setRegistrationSuccess(true);

    setTimeout(() => {
      setAuthMode('login');
      setRegistrationSuccess(false);
    }, 3000);
  } catch (error: any) {
    setErrorMessage(error.message || "There was an error registering.");
  }
};

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <h2 className="text-sm md:text-base lg:text-lg p-2 bg-green-100 text-green-900 font-semibold rounded-md shadow">
            Registration successful! Redirecting to login...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-center text-sm md:text-base lg:text-lg p-2 bg-gold bg-opacity-20 text-black font-semibold rounded-md shadow">
          Register to Submit<br />
          an event to the<br />
          Groove Guide!
        </h1>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className='pb-5'>
              <label htmlFor="first-name" className="sr-only">First name</label>
              <input
                id="first-name"
                name="first-name"
                type="text"
                autoComplete="given-name"
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className='pb-5'>
              <label htmlFor="last-name" className="sr-only">Last name</label>
              <input
                id="last-name"
                name="last-name"
                type="text"
                autoComplete="family-name"
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className='pb-5'>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
              />
            </div>
            <div className='pb-5'>
              <label htmlFor="description" className="sr-only">Description</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold transition duration-150"
                placeholder="Describe yourself"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className='pb-5'>
              <label htmlFor="genres" className="sr-only">Genres</label>
              <div className="flex flex-wrap">
                {genreOptions.map((genre) => (
                  <div key={genre} className="mr-2 mb-2">
                    <label className="flex items-center space-x-2 text-sm hover:text-gold transition duration-150">
                      <input
                        type="checkbox"
                        className="h-5 w-5 text-gold focus:ring-gold accent-gold cursor-pointer"
                        value={genre}
                        checked={genres.includes(genre)}
                        onChange={() => handleGenreChange(genre)}
                      />
                      <span className="ml-2">{genre}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-2 text-sm text-gray-600">
                Password must be at least 8 characters long and include a mix of uppercase letters, lowercase letters, numbers, and special characters.
              </p>
            </div>
          </div>
          {errorMessage && <p className="mt-2 text-center text-sm text-red-600">{errorMessage}</p>}
          <div>
            <button type="submit" className="bg-gold text-black px-4 py-2 rounded-md hover:bg-yellow-400 font-semibold hover:bg-yellow-400 transition duration-200 ease-in-out">
              Register
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-black">
          Already have an account?{" "}
          <span
            onClick={() => setAuthMode('login')}
            className="text-gold font-semibold cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
