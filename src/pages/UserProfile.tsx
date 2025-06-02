import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Image from "next/image";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const genresList = [
  "Jazz", "Blues", "Funk", "Indie", "Dance", "Electronic", "Rock", "Alternative",
  "Country", "Hip-Hop", "Pop", "R&B", "Rap", "Reggae", "Soul", "Techno", "World", "Other"
];

const UserProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [description, setDescription] = useState(user?.user_description || "");
  const [genres, setGenres] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState<string>(user?.profile_picture || "");
  const [hasArtistProfile, setHasArtistProfile] = useState(false);
  const [artistSlug, setArtistSlug] = useState("");

  useEffect(() => {
    if (!user) router.push("/");
  }, [user, router]);

  useEffect(() => {
    if (user?.top_music_genres) {
      try {
        const parsed = Array.isArray(user.top_music_genres)
          ? user.top_music_genres
          : JSON.parse(user.top_music_genres);
        setGenres(parsed || []);
      } catch (err) {
        console.error("Genre parse error", err);
        setGenres([]);
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchPicture = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile-picture`, { credentials: "include" });
        const data = await res.json();
        if (data.profile_picture_url) setProfilePicture(data.profile_picture_url);
      } catch (err) {
        console.error("Image fetch error", err);
      }
    };
    fetchPicture();
  }, []);

  useEffect(() => {
    const checkArtistProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/artists/user/${user?.id}`, {
          credentials: 'include',
        });
  
        if (res.ok) {
          const data = await res.json();
          setHasArtistProfile(true);
          setArtistSlug(data.slug);
        } else if (res.status === 404) {
          // Expected: no artist profile yet
          setHasArtistProfile(false);
        } else {
          console.error("Unexpected response checking artist profile:", res.status);
        }
      } catch (err) {
        console.error("Network or server error checking artist profile:", err);
      }
    };
  
    if (user?.id) checkArtistProfile();
  }, [user]);
  

  const handleGenreChange = (genre: string) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter((g) => g !== genre));
    } else if (genres.length < 3) {
      setGenres([...genres, genre]);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const formData = new FormData();
    formData.append("first_name", user.first_name);
    formData.append("last_name", user.last_name);
    formData.append("displayName", displayName);
    formData.append("email", email);
    formData.append("user_description", description);
    formData.append("top_music_genres", JSON.stringify(genres));
    if (file) formData.append("profile_picture", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      setProfilePicture(data.profile_picture);
      updateUser({ ...user, email, user_description: description, displayName: displayName, top_music_genres: genres, profile_picture: data.profile_picture });
      setMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setMessage("Error updating profile.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleResetPassword = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setMessage("Failed to send reset email.");
    }
  };

  return user ? (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">🎤 Profile: {user.first_name} {user.last_name}</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 flex justify-center">
            {profilePicture && (
              <Image
                src={profilePicture}
                alt="Profile Picture"
                width={200}
                height={200}
                className="rounded-full w-[200px] h-[200px] object-cover"
              />
            )}
          </div>

          <div className="md:w-2/3 bg-gray-800 p-6 rounded-lg shadow-md">
            {isEditing ? (
              <>
                <label className="block mb-4">
                  📧 Email:
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 mt-1 rounded text-black"
                  />
                </label>
                <label className="block mb-4">
                  Display Name:
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full p-2 mt-1 rounded text-black"
                  />
                </label>
                <label className="block mb-4">
                  📝 Bio / About:
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 mt-1 rounded text-black"
                  />
                </label>
                <label className="block mb-4 font-semibold">🎶 Favorite Genres (pick up to 3):</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {genresList.map((genre) => (
                    <label key={genre} className="flex items-center">
                      <input
                        type="checkbox"
                        value={genre}
                        checked={genres.includes(genre)}
                        onChange={() => handleGenreChange(genre)}
                        className="mr-2"
                      />
                      {genre}
                    </label>
                  ))}
                </div>
                <label className="block mb-4">
                  📷 Upload New Picture:
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full mt-1 text-sm text-gray-300"
                  />
                </label>
              </>
            ) : (
              <>
                <p className="mb-3"><strong>Email:</strong> {email}</p>
                <p className="mb-3"><strong>Artist, Band, or Venue Name:</strong> {displayName || "N/A"}</p>
                <p className="mb-3"><strong>About:</strong> {description || "No description"}</p>
                <p className="mb-3"><strong>Genres:</strong> {genres.length > 0 ? genres.join(", ") : "None selected"}</p>
              </>
            )}

            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
              {isEditing && (
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
                >
                  Save Changes
                </button>
              )}
              <button
                onClick={handleResetPassword}
                className="bg-yellow-500 hover:bg-yellow-600 text-black py-2 rounded font-semibold"
              >
                Reset Password
              </button>
              <button
                onClick={() => router.push("/")}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 rounded font-semibold"
              >
                Back to Home
              </button>

                {user?.is_admin && !hasArtistProfile && (
                <>
                  <button
                  onClick={() => router.push("/artist-signup")}
                  className="bg-teal-600 hover:bg-teal-700 text-white py-2 rounded font-semibold"
                  >
                    🎁 Create Pro Artist Profile (Free Trial)
                  </button>
                  <p className="text-xs text-gray-400 mt-1">
                    Get 30 days of free access to Alpine Pro features — no credit card required.
                  </p>
                </>
                )}
                { hasArtistProfile && (
                <button
                  onClick={() => router.push(`/artists/${artistSlug}`)}
                  className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-semibold"
                >
                  Alpine Pro Dashboard
                </button>
              )}
              {message && <div className="text-center text-sm text-red-400 mt-2">{message}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="text-center text-white mt-20">Loading profile...</div>
  );
};

export default UserProfile;
