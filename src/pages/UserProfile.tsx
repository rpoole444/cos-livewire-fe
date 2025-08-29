import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Image from "next/image";
import Link from 'next/link';
import TrialBanner from '@/components/TrialBanner';
import ActiveTrialNoProfileBanner from '@/components/ActiveTrialNoProfileBanner';
import { isTrialActive } from '@/util/isTrialActive';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const genresList = [
  "Jazz", "Blues", "Funk", "Indie", "Dance", "Electronic", "Rock", "Alternative",
  "Country", "Hip-Hop", "Pop", "R&B", "Rap", "Reggae", "Soul", "Techno", "World", "Other"
];

const UserProfile: React.FC = () => {
  const { user, loading, updateUser, refetchUser } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState("");
  const [hasArtistProfile, setHasArtistProfile] = useState(false);
  const [artistSlug, setArtistSlug] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showApprovalToast, setShowApprovalToast] = useState(false);
  const [showTrialToast, setShowTrialToast] = useState(false);
  const approvalRef = useRef<boolean | null>(null);
  const refetchedOnce = useRef(false);
 const [hasRefetched, setHasRefetched] = useState(false);

const trialActive = !!user?.trial_ends_at && isTrialActive(user.trial_ends_at);
const trialStarted = !!user?.trial_ends_at;
const hasProAccess = !!user?.is_pro || trialActive;
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
const trialExpired = !!user?.trial_ends_at && !trialActive && !user?.is_pro;

  const [formError, setFormError] = useState("");

  // If redirected from Stripe, fetch updated user info once
  useEffect(() => {
    if (!router.isReady || refetchedOnce.current) return;

    const { success, trial } = router.query;

    const run = async () => {
      if (success === 'true' || trial === 'active') {
        await refetchUser();

        if (success === 'true') {
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 5000);
        }

        if (trial === 'active') {
          setShowTrialToast(true);
          setTimeout(() => setShowTrialToast(false), 5000);
        }

        router.replace({ pathname: router.pathname, query: {} }, undefined, { shallow: true });
      }

      setHasRefetched(true);
      refetchedOnce.current = true;
    };

    run();
  }, [router.isReady, refetchUser]);
  

  // Once user is available, populate form values
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setDisplayName(user.displayName || "");
      setDescription(user.user_description || "");
      setGenres(Array.isArray(user.top_music_genres) ? user.top_music_genres : []);
      setProfilePicture(user.profile_picture || "");
    }
  }, [user]);

  // Check for associated artist profile
 useEffect(() => {
  let cancelled = false;

  const checkArtistProfile = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/artists/mine`, {
        credentials: 'include',
      });

      if (!res.ok) {
        console.error('Artist /mine fetch error:', res.status);
        if (!cancelled) {
          setHasArtistProfile(false);
          setArtistSlug('');
          setIsApproved(null);
        }
        return; // ← important: don't call res.json() on non-OK
      }

      const data = await res.json().catch(() => null);
      const artist = data?.artist ?? null;

      if (!cancelled) {
        if (artist) {
          setHasArtistProfile(true);
          setArtistSlug(artist.slug);
          setIsApproved(artist.is_approved);
        } else {
          setHasArtistProfile(false);
          setArtistSlug('');
          setIsApproved(null);
        }
      }
    } catch (err) {
      console.error('Artist /mine fetch failed:', err);
      if (!cancelled) {
        setHasArtistProfile(false);
        setArtistSlug('');
        setIsApproved(null);
      }
    }
  };

  checkArtistProfile();
  return () => {
    cancelled = true;
  };
}, [user?.id]); // only re-run when the user id changes

  useEffect(() => {
    if (approvalRef.current === false && isApproved) {
      setShowApprovalToast(true);
      setTimeout(() => setShowApprovalToast(false), 5000);
    }
    approvalRef.current = isApproved;
  }, [isApproved]);

  useEffect(() => {
    if (router.query.approved === 'true') {
      setShowApprovalToast(true);
      const cleaned = new URL(window.location.href);
      cleaned.searchParams.delete('approved');
      window.history.replaceState({}, document.title, cleaned.toString());
      setTimeout(() => setShowApprovalToast(false), 5000);
    }
  }, [router.query]);

  

  // Clear messages after 3 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const handleManageBilling = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/billing-portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Error redirecting to billing portal:", err);
      setMessage("Unable to open billing portal at this time.");
    }
  };

  const handleGenreChange = (genre: string) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter((g) => g !== genre));
    } else if (genres.length < 3) {
      setGenres([...genres, genre]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    // Basic validation
    if (!displayName.trim()) {
      setFormError("Display name is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (genres.length > 3) {
      setFormError("You can select up to 3 genres.");
      return;
    }

    if (file && !file.type.startsWith("image/")) {
      setFormError("Only image files are allowed for profile pictures.");
      return;
    }

    // Clear error if validation passed
    setFormError("");

    const formData = new FormData();
    formData.append("first_name", user.first_name || "");
    formData.append("last_name", user.last_name || "");
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
      updateUser({
        ...user,
        email,
        user_description: description,
        displayName,
        top_music_genres: genres,
        profile_picture: data.profile_picture,
      });
      setProfilePicture(data.profile_picture);
      setMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setMessage("Error updating profile.");
    }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
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
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Stripe session error", err);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleRestoreProfile = async () => {
    if (!user) return;
  
    try {
      const res = await fetch(`${API_BASE_URL}/api/artists/by-user/${user.id}/restore`, {
        method: 'PUT',
        credentials: 'include',
      });
  
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const errorMsg = errData?.message || 'Failed to restore profile';
        setMessage(errorMsg);
        return;
      }
  
      const data = await res.json();
      setHasArtistProfile(true);
      setArtistSlug(data.slug);
      setMessage('Profile restored successfully!');
    } catch (err) {
      console.error('Restore profile error:', err);
      setMessage('An error occurred while restoring your profile.');
    }
  };
useEffect(() => {
  // temporary debug – remove after verifying once
  console.log('trial_ends_at:', user?.trial_ends_at,
              'trialActive:', trialActive,
              'is_pro:', user?.is_pro,
              'hasArtistProfile:', hasArtistProfile,
              'isApproved:', isApproved);
}, [user?.trial_ends_at, trialActive, user?.is_pro, hasArtistProfile, isApproved]);


// after
const gotoCreateProfile = () => router.push('/artist-signup?from=profile');


  if (loading || !hasRefetched) {
    return <div className="text-white text-center mt-20">Loading your profile...</div>;
  }

  if (!user) {
    return <div className="text-white text-center mt-20">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <TrialBanner trial_ends_at={user?.trial_ends_at} is_pro={user?.is_pro} />
      {trialActive && !hasArtistProfile && <ActiveTrialNoProfileBanner />}
      {showSuccessToast && (
        <div className="bg-green-600 text-white text-sm text-center px-4 py-2 rounded shadow mb-4 max-w-xl mx-auto">
          ✅ Success! You’ve unlocked Alpine Pro.
        </div>
      )}
      {showApprovalToast && (
        <div className="bg-green-600 text-white text-sm text-center px-4 py-2 rounded shadow mb-4 max-w-xl mx-auto">
          🎉 You’re live on the directory!
        </div>
      )}
      {showTrialToast && (
        <div className="bg-green-600 text-white text-sm text-center px-4 py-2 rounded shadow mb-4 max-w-xl mx-auto">
          ✅ Welcome! Your 30-day free trial of Alpine Pro is active.
        </div>
      )}
      {!hasProAccess && (
        <div className="text-center mb-4">
          {trialActive ? (
            <Link href="/artist-signup?from=profile" className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded font-semibold">
                Publish now (trial active)
            </Link>
          ) : trialExpired ? (
            <Link href="/upgrade" className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded font-semibold" >
                Re-activate to continue
            </Link>
          ) : null}
        </div>
      )}
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          🎤 Profile: {user.displayName}
          {user?.is_pro ? (
            <span className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              Alpine Pro Member
            </span>
          ) : trialActive ? (
            <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              On Free Trial
            </span>
          ) : null}
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
              {formError && (
                <div className="text-red-400 text-sm mt-2">{formError}</div>
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
              {user?.is_pro && (
                <button
                  onClick={handleManageBilling}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-semibold"
                >
                  Cancel or Manage Alpine Pro Subscription
                </button>
              )}
             
              {/* Actions around the artist profile card */}
              {!hasArtistProfile && user.is_admin && (
                <>
                  <button onClick={gotoCreateProfile} className="bg-teal-600 hover:bg-teal-700 text-white py-2 rounded font-semibold">
                    🎁 Create Artist Profile
                  </button>
                  {trialActive && (
                    <button onClick={handleRestoreProfile} className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold mt-2">
                      Restore Profile
                    </button>
                  )}
                  {!hasProAccess && (
                    <p className="text-xs text-gray-400 mt-1">
                      Get 30 days of free access to Alpine Pro features — no credit card required.
                    </p>
                  )}
                </>
              )}

              {hasArtistProfile ? (
                isApproved ? (
                  (trialActive || user?.is_pro) ? (
                    <button
                      onClick={() => router.push(`/artists/${artistSlug}?trial=active`)}
                      className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-semibold"
                    >
                      Enter Artist Page
                    </button>
                  ) : (
                    <Link href={trialExpired ? "/upgrade" : "/artist-signup"} className="underline text-blue-300">
                      Activate Pro / Start Trial
                    </Link>
                  )
                ) : (
                  <div className="bg-yellow-100 text-yellow-900 border border-yellow-400 p-4 rounded shadow-md text-sm">
                    <p className="font-semibold mb-2">🎷 Your artist profile is under review</p>
                    <p>You’ll be notified when approved.</p>
                    <button
                      disabled
                      className="mt-3 w-full bg-gray-400 text-white py-2 rounded font-semibold cursor-not-allowed opacity-70"
                    >
                      🔒 Pending Approval
                    </button>
                  </div>
                )
              ) : null}

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
  );
};

export default UserProfile;
