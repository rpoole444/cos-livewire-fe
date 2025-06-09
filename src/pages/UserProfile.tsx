import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Image from "next/image";
import TrialBanner from '@/components/TrialBanner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const genresList = [
  "Jazz", "Blues", "Funk", "Indie", "Dance", "Electronic", "Rock", "Alternative",
  "Country", "Hip-Hop", "Pop", "R&B", "Rap", "Reggae", "Soul", "Techno", "World", "Other"
];

const UserProfile: React.FC = () => {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const { success } = router.query;

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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

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

        if (res.status === 200) {
          const data = await res.json();
          setHasArtistProfile(true);
          setArtistSlug(data.slug);
        } else if (res.status === 404) {
          setHasArtistProfile(false);
          setArtistSlug('');
        } else {
          console.error("Unexpected response checking artist profile:", res.status);
        }
        
      } catch (err) {
        console.error("Network or server error checking artist profile:", err);
      }
    };

    if (user?.id) checkArtistProfile();
  }, [user]);

  useEffect(() => {
    if (!router.isReady) return;
    if (success === 'true') {
      setShowSuccessToast(true);
  
      const cleaned = new URL(window.location.href);
      cleaned.searchParams.delete('success');
      window.history.replaceState({}, document.title, cleaned.toString());
  
      const timeout = setTimeout(() => setShowSuccessToast(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [success,router.isReady]);  

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

  const handleDonate = async (mode: 'payment' | 'subscription') => {
    setCheckoutLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/create-tip-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, amount: 7, mode }),
        credentials: 'include',
      });
      const data = await res.json();
      console.log(data.url)
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Stripe session error", err);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white text-center mt-20">Loading your profile...</div>;
  }
  
  if (!user) {
    return <div className="text-white text-center mt-20">Redirecting...</div>;
  }
  
  return user ? (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <TrialBanner />
      {showSuccessToast && (
        <div className="bg-green-600 text-white text-sm text-center px-4 py-2 rounded shadow mb-4 max-w-xl mx-auto">
          ✅ Success! You’ve unlocked Alpine Pro.
        </div>
      )}
      <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        🎤 Profile: {user?.displayName}
        {user?.is_pro && (
          <div className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            Alpine Pro Member
          </div>
        )}
      </h1>
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
              <div className="mt-4 border-t border-gray-700 pt-4">
                <h3 className="font-semibold mb-2">Support Alpine Groove Guide</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleDonate("payment")}
                    className="bg-pink-600 hover:bg-pink-700 text-white py-2 rounded font-semibold"
                  >
                    💵 Send a $7 Tip
                  </button>
                  <button
                    onClick={() => handleDonate("subscription")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-semibold"
                  >
                    💫 $7/Month Membership
                  </button>
                </div>
              </div>
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
