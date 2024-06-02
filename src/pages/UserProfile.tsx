// pages/UserProfile.tsx
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";

const genresList = [
  "Jazz", "Indie", "Dance", "Electronic","Rock", "Alternative", "Country", "Hip-Hop", "Pop", 
  "R&B", "Rap", "Reggae", "Soul", "Techno", "World", "Other"
];

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [description, setDescription] = useState(user?.user_description || "");
  const [genres, setGenres] = useState<string[]>([]);
  const [message, setMessage] = useState("");
console.log("user: ", user)
  useEffect(() => {
    if (user?.top_music_genres) {
      let parsedGenres: string[] = [];
      try {
        const cleanedGenres = user.top_music_genres.replace(/[{}]/g, '').replace(/\\/g, '');
        if (cleanedGenres.startsWith('[')) {
          parsedGenres = JSON.parse(cleanedGenres.replace(/'/g, '"'));
        } else {
          parsedGenres = cleanedGenres.split(',').map((genre: string) => genre.trim().replace(/"/g, ''));
        }
      } catch (error) {
        parsedGenres = user.top_music_genres.split(',').map((genre: string) => genre.trim().replace(/"/g, ''));
      }
      console.log('Parsed Genres:', parsedGenres); // Debugging line
      setGenres(parsedGenres);
    }
  }, [user]);

  useEffect(() => {
    if (!isEditing && user) {
      setEmail(user.email);
      setDescription(user.user_description);
      let parsedGenres: string[] = [];
      try {
        const cleanedGenres = user.top_music_genres.replace(/[{}]/g, '').replace(/\\/g, '');
        if (cleanedGenres.startsWith('[')) {
          parsedGenres = JSON.parse(cleanedGenres.replace(/'/g, '"'));
        } else {
          parsedGenres = cleanedGenres.split(',').map((genre: string) => genre.trim().replace(/"/g, ''));
        }
      } catch (error) {
        parsedGenres = user.top_music_genres.split(',').map((genre: string) => genre.trim().replace(/"/g, ''));
      }
      console.log('Parsed Genres on edit:', parsedGenres); // Debugging line
      setGenres(parsedGenres);
    }
  }, [isEditing, user]);

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleGenreChange = (genre: string) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter((g) => g !== genre));
    } else if (genres.length < 3) {
      setGenres([...genres, genre]);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include credentials (cookies) with the request
        body: JSON.stringify({
          first_name: user?.first_name,
          last_name: user?.last_name,
          email,
          user_description: description,
          top_music_genres: genres,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setMessage(data.message);
      setIsEditing(false);

      // Manually update the user object to reflect changes in the UI
      user.email = email;
      user.user_description = description;
      user.top_music_genres = genres.join(", ");
    } catch (error) {
      console.error(error);
      setMessage("Error updating profile");
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include credentials (cookies) with the request
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reset password email");
      }

      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      console.error(error);
      setMessage("Error sending reset password email");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">User Profile</h1>
        {user ? (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <div className="mb-4">
              <label className="block font-semibold">Name:</label>
              <span>{user.first_name} {user.last_name}</span>
            </div>
            <div className="mb-4">
              <label className="block font-semibold">Email:</label>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border p-2 rounded w-full text-black"
                />
              ) : (
                <span>{email}</span>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-semibold">Description:</label>
              {isEditing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border p-2 rounded w-full text-black"
                />
              ) : (
                <span>{description}</span>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-semibold">Favorite Genres:</label>
              {isEditing ? (
                <div>
                  {genresList.map((genre) => (
                    <div key={genre} className="mb-2">
                      <input
                        type="checkbox"
                        id={genre}
                        value={genre}
                        checked={genres.includes(genre)}
                        onChange={() => handleGenreChange(genre)}
                        className="mr-2"
                      />
                      <label htmlFor={genre}>{genre}</label>
                    </div>
                  ))}
                </div>
              ) : (
                <span>{genres.join(", ")}</span>
              )}
            </div>
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 mb-4 w-full"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 mb-4 w-full"
              >
                Save Changes
              </button>
            )}
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 mt-4 w-full"
            >
              Back to Home
            </button>
            <button
              onClick={handleResetPassword}
              className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-md hover:bg-yellow-600 mt-4 w-full"
            >
              Reset Password
            </button>
            {message && <div className="mt-4 text-center text-red-500">{message}</div>}
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
