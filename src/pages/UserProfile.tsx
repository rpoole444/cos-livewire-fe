import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";

const genresList = [
  "Jazz", "Indie", "Dance", "Electronic", "Rock", "Alternative", "Country", "Hip-Hop", "Pop", 
  "R&B", "Rap", "Reggae", "Soul", "Techno", "World", "Other"
];

const UserProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [description, setDescription] = useState(user?.user_description || "");
  const [genres, setGenres] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState<string>(user?.profile_picture || "");

  useEffect(() => {
    if (!user) {
      router.push("/"); // Redirect to login if not authenticated
    }
  }, [user, router]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!user) {
      setMessage("User is not authenticated");
      return;
    }

    const formData = new FormData();
    formData.append('first_name', user?.first_name || "");
    formData.append('last_name', user?.last_name || "");
    formData.append('email', email);
    formData.append('user_description', description);
    formData.append('top_music_genres', JSON.stringify(genres));

    if (file) {
      formData.append('profile_picture', file);
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/update-profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${user.token}`, // Include the token in the header
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setMessage(data.message);
      setIsEditing(false);

      const updatedUser = {
        ...user,
        email,
        user_description: description,
        top_music_genres: genres.join(", "),
        profile_picture: data.profile_picture_url,
      };
      updateUser(updatedUser);
      setProfilePicture(data.profile_picture_url);
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

  return user ? (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">User Profile</h1>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 flex justify-center mb-4 md:mb-0">
            {profilePicture && (
              <div className="md:mb-4">
                <img src={profilePicture} alt="Profile Picture" className="w-48 h-48 rounded-full object-cover"/>
              </div>
            )}
          </div>
          <div className="md:w-2/3 bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto md:mx-0 md:max-w-full">
            <>
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
              {isEditing && (
                <div className="mb-4">
                  <label htmlFor="profilePicture" className="block font-semibold">Profile Picture:</label>
                  <input
                    type="file"
                    id="profilePicture"
                    name="profilePicture"
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="border p-2 rounded w-full text-black"
                  />
                </div>
              )}
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
            </>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <p>Loading...</p>
  );
};

export default UserProfile;
