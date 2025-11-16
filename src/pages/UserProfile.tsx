import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import Image from "next/image";
import Link from 'next/link';
import TrialBanner from '@/components/TrialBanner';
import { isTrialActive } from '@/util/isTrialActive';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const genresList = [
  "Jazz", "Blues", "Funk", "Indie", "Dance", "Electronic", "Rock", "Alternative",
  "Country", "Hip-Hop", "Pop", "R&B", "Rap", "Reggae", "Soul", "Techno", "World", "Other"
];

type ArtistProfileStatus = {
  artist: {
    slug?: string;
    display_name?: string;
    is_approved?: boolean;
    deleted_at?: string | null;
  } | null;
  deletedArtist: {
    slug?: string;
  } | null;
  canRestore: boolean;
};

const UserProfile: React.FC = () => {
  const { user, loading, updateUser, refreshSession } = useAuth();
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
  const [artistDisplayName, setArtistDisplayName] = useState("");
  const [canRestoreProfile, setCanRestoreProfile] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showApprovalToast, setShowApprovalToast] = useState(false);
  const [showTrialToast, setShowTrialToast] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState("");
  const approvalRef = useRef<boolean | null>(null);
  const refetchedOnce = useRef(false);
  const accountSectionRef = useRef<HTMLDivElement | null>(null);
 const [hasRefetched, setHasRefetched] = useState(false);

const trialActive = !!user?.trial_ends_at && isTrialActive(user.trial_ends_at);
const isProActive = !!user?.pro_active;
const canUseProFeatures = isProActive;
const proCancelledAt = user?.pro_cancelled_at ? new Date(user.pro_cancelled_at) : null;
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
const trialExpired = !!user?.trial_ends_at && !trialActive && !isProActive;
const rawDisplayName = (user?.display_name ?? user?.displayName ?? "").trim();
const isFirstTimeProfile = rawDisplayName.length === 0;
const displayNameMissing = isFirstTimeProfile;
const profileHeadingName = user?.displayName || user?.display_name || user?.email || "Your Profile";
const canVisitPublicPage = Boolean(isApproved && (trialActive || canUseProFeatures));
const canShowArtistWelcome = !displayNameMissing && !hasArtistProfile && !isEditing;

  const [formError, setFormError] = useState("");

  const applyArtistProfileStatus = useCallback((status: ArtistProfileStatus | null) => {
    if (!status) {
      setHasArtistProfile(false);
      setArtistSlug("");
      setArtistDisplayName("");
      setIsApproved(null);
      setCanRestoreProfile(false);
      setRestoreError("");
      return;
    }

    const { artist, deletedArtist, canRestore } = status;
    const hasActiveArtist = !!artist && !artist.deleted_at;

    setHasArtistProfile(hasActiveArtist);
    setArtistSlug(hasActiveArtist ? artist.slug || "" : "");
   setArtistDisplayName(
  hasActiveArtist ? (artist.display_name || "") : ""
);

    setIsApproved(
      hasActiveArtist
        ? typeof artist.is_approved === "boolean"
          ? artist.is_approved
          : true
        : null
    );

    const restoreAvailable = !hasActiveArtist && (canRestore || !!deletedArtist);
    setCanRestoreProfile(restoreAvailable);

    if (hasActiveArtist || !restoreAvailable) {
      setRestoreError("");
    }
  }, []);

  const fetchArtistProfileStatus = useCallback(async (): Promise<ArtistProfileStatus | null> => {
    if (!user?.id) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/api/artists/mine`, {
        credentials: 'include',
      });

      if (!res.ok) {
        console.error('Artist /mine fetch error:', res.status);
        return { artist: null, deletedArtist: null, canRestore: false };
      }

      const data = await res.json().catch(() => null);
      const artist = (data?.artist ?? null) as ArtistProfileStatus["artist"];
      const deletedArtist = (data?.deletedArtist ?? data?.deleted_artist ?? null) as ArtistProfileStatus["deletedArtist"];
      const canRestoreFlag = Boolean(data?.canRestore ?? data?.can_restore ?? deletedArtist);

      return { artist, deletedArtist, canRestore: canRestoreFlag };
    } catch (err) {
      console.error('Artist /mine fetch failed:', err);
      return { artist: null, deletedArtist: null, canRestore: false };
    }
  }, [user?.id]);

  // Refresh auth/session info once per mount (and surface Stripe toasts if query flags exist)
  useEffect(() => {
    if (!router.isReady || refetchedOnce.current) return;

    const { success, trial } = router.query;

    const run = async () => {
      await refreshSession();

      if (success === 'true') {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }

      if (trial === 'active') {
        setShowTrialToast(true);
        setTimeout(() => setShowTrialToast(false), 5000);
      }

      if (success === 'true' || trial === 'active') {
        router.replace({ pathname: router.pathname, query: {} }, undefined, { shallow: true });
      }

      setHasRefetched(true);
      refetchedOnce.current = true;
    };

    run();
  }, [router.isReady, router.query, router, refreshSession]);
  
  // If Stripe sent the user back with ?billing=..., refresh again for up-to-date status.
  const billingStatus = router.query.billing;
  useEffect(() => {
    if (!router.isReady) return;
    if (!billingStatus) return;

    const refreshAfterBilling = async () => {
      await refreshSession();
      const nextQuery = { ...router.query };
      delete nextQuery.billing;
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
    };

    refreshAfterBilling();
  }, [router.isReady, billingStatus, router, refreshSession]);

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

  useEffect(() => {
    if (user && displayNameMissing) {
      setIsEditing(true);
    }
  }, [user, displayNameMissing]);

  // Check for associated artist profile
 useEffect(() => {
  let cancelled = false;

  const checkArtistProfile = async () => {
    if (!user?.id) {
      applyArtistProfileStatus(null);
      return;
    }

    const status = await fetchArtistProfileStatus();
    if (!cancelled) {
      applyArtistProfileStatus(status);
    }
  };

  checkArtistProfile();
  return () => {
    cancelled = true;
  };
}, [user?.id, fetchArtistProfileStatus, applyArtistProfileStatus]); // only re-run when the user id changes

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
        display_name: displayName,
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

    setRestoreError("");
    setMessage("");
    setRestoreLoading(true);
  
    try {
      const res = await fetch(`${API_BASE_URL}/api/artists/by-user/${user.id}/restore`, {
        method: 'PUT',
        credentials: 'include',
      });

      const responseBody = await res.json().catch(() => null);
  
      if (!res.ok) {
        const errorMsg = responseBody?.message || 'Failed to restore profile';
        setRestoreError(errorMsg);
        setMessage(errorMsg);
        return;
      }

      setMessage('Profile restored successfully!');
      const status = await fetchArtistProfileStatus();
      applyArtistProfileStatus(status);
    } catch (err) {
      console.error('Restore profile error:', err);
      const errorMsg = 'An error occurred while restoring your profile.';
      setRestoreError(errorMsg);
      setMessage(errorMsg);
    } finally {
      setRestoreLoading(false);
    }
  };
useEffect(() => {
  // temporary debug – remove after verifying once
  console.log('trial_ends_at:', user?.trial_ends_at,
              'trialActive:', trialActive,
              'pro_active:', user?.pro_active,
              'hasArtistProfile:', hasArtistProfile,
              'isApproved:', isApproved);
}, [user?.trial_ends_at, trialActive, user?.pro_active, hasArtistProfile, isApproved]);


// after
const gotoCreateProfile = () => router.push('/artist-signup?from=profile');
const startAccountSetup = () => {
  setIsEditing(true);
  accountSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};


  if (loading || !hasRefetched) {
    return <div className="text-white text-center mt-20">Loading your profile...</div>;
  }

  if (!user) {
    return <div className="text-white text-center mt-20">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        {showSuccessToast && (
          <div className="bg-green-600 text-white text-sm text-center px-4 py-2 rounded shadow">
            ✅ Success! You’ve unlocked Alpine Pro.
          </div>
        )}
        {showApprovalToast && (
          <div className="bg-green-600 text-white text-sm text-center px-4 py-2 rounded shadow">
            🎉 You’re live on the directory!
          </div>
        )}
        {showTrialToast && (
          <div className="bg-green-600 text-white text-sm text-center px-4 py-2 rounded shadow">
            ✅ Welcome! Your 30-day free trial of Alpine Pro is active.
          </div>
        )}

        <h1 className="text-3xl font-bold flex items-center gap-3">
          🎤 Profile: {profileHeadingName}
          {isProActive ? (
            <span className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              Alpine Pro Member
            </span>
          ) : trialActive ? (
            <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              On Free Trial
            </span>
          ) : null}
        </h1>

        {isFirstTimeProfile && (
          <div className="bg-blue-900/30 border border-blue-600 rounded-xl p-6 space-y-3 shadow">
            <h2 className="text-2xl font-semibold">Finish your account profile</h2>
            <p className="text-gray-200 text-sm">
              Welcome to Alpine Groove Guide! Add a display name, short bio, and your favorite genres so venues know who you are.
            </p>
            <button
              onClick={startAccountSetup}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded font-semibold transition"
            >
              Set up my profile
            </button>
          </div>
        )}

        <section ref={accountSectionRef} className="bg-gray-800 p-6 rounded-2xl shadow space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold">Your Account Profile</h2>
            <p className="text-gray-300 text-sm">
              Update your basic info – this appears on submissions and messages from Alpine Groove Guide.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3 flex justify-center">
              {profilePicture ? (
                <Image
                  src={profilePicture}
                  alt="Profile Picture"
                  width={200}
                  height={200}
                  className="rounded-full w-[200px] h-[200px] object-cover"
                />
              ) : (
                <div className="w-[200px] h-[200px] rounded-full bg-gray-700 flex items-center justify-center text-gray-500">
                  No photo yet
                </div>
              )}
            </div>

            <div className="md:w-2/3">
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
                  <p className="mb-3"><strong>Name:</strong> {displayName || "N/A"}</p>
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
              </div>
            </div>
          </div>
        </section>

        {!isFirstTimeProfile && (
          <section className="bg-gray-800 p-6 rounded-2xl shadow space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold">Artist / Venue</h2>
              <p className="text-gray-300 text-sm">
                Manage your public listing for fans, venues, and promoters.
              </p>
            </div>

            {!hasArtistProfile ? (
              <>
                {canShowArtistWelcome && (
                  <div className="bg-gray-900/40 border border-gray-700 rounded-xl p-5 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold">Welcome to Alpine Groove Guide</h3>
                      <p className="text-gray-300 text-sm">
                        Create your artist or venue page so fans, venues, and promoters can discover you.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={gotoCreateProfile}
                        className="bg-teal-500 hover:bg-teal-600 text-white py-2 rounded font-semibold"
                      >
                        Create Artist / Venue Page
                      </button>
                      {canRestoreProfile && (
                        <button
                          onClick={handleRestoreProfile}
                          disabled={restoreLoading}
                          className={`bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold ${restoreLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                          {restoreLoading ? "Restoring…" : "Restore Previous Page"}
                        </button>
                      )}
                      {restoreError && canRestoreProfile && (
                        <p className="text-xs text-red-400">{restoreError}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => accountSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className="text-sm text-gray-300 underline hover:text-white text-left"
                      >
                        Skip for now, go to your dashboard →
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="bg-gray-900/40 border border-gray-700 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-xl font-semibold">{artistDisplayName || "Your artist profile"}</p>
                      <p className="text-sm text-gray-400">
                        Status: {isApproved ? "Approved" : "Pending review"}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => router.push(`/artists/${artistSlug}`)}
                        disabled={!canVisitPublicPage}
                        title={canVisitPublicPage ? "View your public page" : "Your page is offline until your trial or subscription is active"}
                        className={`py-2 px-4 rounded font-semibold ${canVisitPublicPage ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-900/50 text-purple-200 cursor-not-allowed"}`}
                      >
                        View Public Page
                      </button>
                      <button
                        onClick={() => router.push(`/artists/edit/${artistSlug}`)}
                        className="py-2 px-4 rounded font-semibold bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        Edit Artist Profile
                      </button>
                    </div>
                  </div>

                  {!isApproved && (
                    <div className="bg-yellow-100 text-yellow-900 border border-yellow-400 p-4 rounded text-sm">
                      🎷 Your artist profile is under review. You’ll be notified when it’s approved.
                    </div>
                  )}

                  <div className="space-y-4">
                    <TrialBanner trial_ends_at={user?.trial_ends_at} is_pro={user?.pro_active} />
                    {isProActive && proCancelledAt && (
                      <div className="rounded-md border border-yellow-400 bg-yellow-50 text-yellow-900 px-3 py-2 text-sm">
                        Your Alpine Pro subscription is scheduled to end on{" "}
                        <strong>{proCancelledAt.toLocaleDateString()}</strong>. Visit Billing to keep your profile live.
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {canUseProFeatures ? (
                        <button
                          onClick={handleManageBilling}
                          className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-semibold"
                        >
                          Cancel or Manage Alpine Pro Subscription
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push("/upgrade")}
                          className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-semibold"
                        >
                          Upgrade to Alpine Pro
                        </button>
                      )}
                    </div>
                    {!canUseProFeatures && !trialActive && (
                      <p className="text-sm text-gray-400">
                        Upgrade to Alpine Pro to make your artist page public again.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        <section className="bg-gray-800 p-6 rounded-2xl shadow space-y-4">
          <h3 className="font-semibold text-xl">Support Alpine Groove Guide</h3>
          <p className="text-sm text-gray-300">
            Help keep the directory running and discoverable for local artists.
          </p>
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
        </section>

        {message && <div className="text-center text-sm text-red-400">{message}</div>}
      </div>
    </div>
  );
};

export default UserProfile;
