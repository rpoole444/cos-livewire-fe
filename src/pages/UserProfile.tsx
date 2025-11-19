import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
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
    profile_image?: string | null;
  } | null;
  deletedArtist: {
    slug?: string;
  } | null;
  canRestore: boolean;
};

const UserProfile: React.FC = () => {
  const { user, loading, updateUser, refreshSession } = useAuth();
  const router = useRouter();
  const { isReady: routerReady, pathname, replace, query } = router;
  const successParam = query?.success;
  const trialParam = query?.trial;
  const billingParam = query?.billing;

  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState("");
  const [artistImage, setArtistImage] = useState<string | null>(null);
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
const normalizedDisplayName = rawDisplayName.toLowerCase();
const normalizedEmail = (user?.email ?? "").trim().toLowerCase();
const isDefaultDisplayName = normalizedDisplayName !== "" && normalizedDisplayName === normalizedEmail;
const needsProfileSetup = rawDisplayName.length === 0 || isDefaultDisplayName;
const displayNameMissing = needsProfileSetup;
const profileHeadingName = user?.displayName || user?.display_name || user?.email || "Your Profile";
const avatarSource = artistImage || profilePicture || null;
const avatarInitial = (artistDisplayName || profileHeadingName)?.charAt(0)?.toUpperCase() || "?";
const canVisitPublicPage = Boolean(isApproved && (trialActive || canUseProFeatures));
const [artistCardDismissed, setArtistCardDismissed] = useState(false);
const canShowArtistWelcome = !needsProfileSetup && !hasArtistProfile && !isEditing && !artistCardDismissed;
const shouldShowTrialBanner = !canUseProFeatures && trialActive;
const shouldShowCancelBanner = canUseProFeatures && !!proCancelledAt;
const trialEndDate = user?.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString() : null;
let artistStatusLabel = "No artist page";
let artistStatusClass = "border border-slate-600 bg-slate-800 text-slate-200";
if (hasArtistProfile) {
  if (!isApproved) {
    artistStatusLabel = "Pending approval";
    artistStatusClass = "border border-amber-400/40 bg-amber-500/10 text-amber-100";
  } else if (canUseProFeatures) {
    artistStatusLabel = "Live";
    artistStatusClass = "border border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
  } else if (trialActive) {
    artistStatusLabel = "Live (trial)";
    artistStatusClass = "border border-blue-400/40 bg-blue-500/10 text-blue-100";
  } else {
    artistStatusLabel = "Hidden";
    artistStatusClass = "border border-slate-600 bg-slate-800 text-slate-200";
  }
}

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
    setArtistDisplayName(hasActiveArtist ? artist.display_name || "" : "");
    setArtistImage(hasActiveArtist ? artist.profile_image || null : null);

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
    if (!routerReady || refetchedOnce.current) return;

    const run = async () => {
      await refreshSession();

      if (successParam === 'true') {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }

      if (trialParam === 'active') {
        setShowTrialToast(true);
        setTimeout(() => setShowTrialToast(false), 5000);
      }

      if (successParam === 'true' || trialParam === 'active') {
        replace({ pathname, query: {} }, undefined, { shallow: true });
      }

      setHasRefetched(true);
      refetchedOnce.current = true;
    };

    run();
  }, [routerReady, successParam, trialParam, pathname, replace, refreshSession]);
  
  // If Stripe sent the user back with ?billing=..., refresh again for up-to-date status.
  useEffect(() => {
    if (!routerReady) return;
    if (!billingParam) return;

    const refreshAfterBilling = async () => {
      await refreshSession();
      const nextQuery = { ...query };
      delete nextQuery.billing;
      replace({ pathname, query: nextQuery }, undefined, { shallow: true });
    };

    refreshAfterBilling();
  }, [routerReady, billingParam, query, replace, pathname, refreshSession]);

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
    if (query?.approved === 'true') {
      setShowApprovalToast(true);
      const cleaned = new URL(window.location.href);
      cleaned.searchParams.delete('approved');
      window.history.replaceState({}, document.title, cleaned.toString());
      setTimeout(() => setShowApprovalToast(false), 5000);
    }
  }, [query]);

  

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
// after
const gotoCreateProfile = () => router.push('/artist-signup?from=profile');
const startAccountSetup = () => {
  setIsEditing(true);
  accountSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
const inputFieldClasses =
  "w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/70";
const textareaClasses =
  "w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/70";


  if (loading || !hasRefetched) {
    return <div className="text-white text-center mt-20">Loading your profile...</div>;
  }

  if (!user) {
    return <div className="text-white text-center mt-20">Redirecting...</div>;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_60%)]" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-10 space-y-6 sm:px-6 lg:px-0 lg:py-16">
        {showSuccessToast && (
          <div className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-center text-sm text-emerald-200">
            ✅ Success! You’ve unlocked Alpine Pro.
          </div>
        )}
        {showApprovalToast && (
          <div className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-center text-sm text-emerald-200">
            🎉 You’re live on the directory!
          </div>
        )}
        {showTrialToast && (
          <div className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-center text-sm text-emerald-200">
            ✅ Welcome! Your 30-day free trial of Alpine Pro is active.
          </div>
        )}

        <section className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-xl shadow-black/30 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {avatarSource ? (
                <Image
                  src={avatarSource}
                  alt={profileHeadingName}
                  width={96}
                  height={96}
                  className="h-20 w-20 rounded-2xl border border-slate-800 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-800 bg-gradient-to-br from-emerald-500 to-indigo-600 text-2xl font-semibold text-slate-950">
                  {avatarInitial}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Profile</p>
                <h1 className="text-2xl font-semibold text-white sm:text-3xl">{profileHeadingName}</h1>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isProActive ? (
                <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Alpine Pro
                </span>
              ) : trialActive ? (
                <span className="inline-flex items-center rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-100">
                  On free trial
                </span>
              ) : null}
            </div>
          </div>
          {needsProfileSetup && (
            <div className="mt-6 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100">
              <h2 className="text-lg font-semibold text-white">Finish your account profile</h2>
              <p className="mt-1 text-slate-100">
                Add a display name, short bio, and your favorite genres so venues know who you are.
              </p>
              <button
                onClick={startAccountSetup}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0"
              >
                Set up my profile
              </button>
            </div>
          )}
        </section>

        <section
          ref={accountSectionRef}
          className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-xl shadow-black/30 space-y-6 sm:p-8"
        >
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">My Account</p>
            <h2 className="text-2xl font-semibold text-white">Your Profile</h2>
            <p className="text-slate-300 text-sm">
              Update your basic info – this appears on submissions and messages from Alpine Groove Guide.
            </p>
            {needsProfileSetup && (
              <span className="text-sm text-emerald-200 font-semibold">Step 1: Set up your profile</span>
            )}
          </div>

          <div className="flex flex-col gap-8 md:flex-row">
            <div className="flex justify-center md:w-1/3">
              {profilePicture ? (
                <Image
                  src={profilePicture}
                  alt="Profile Picture"
                  width={200}
                  height={200}
                  className="h-[200px] w-[200px] rounded-2xl border border-slate-800 object-cover"
                />
              ) : (
                <div className="flex h-[200px] w-[200px] items-center justify-center rounded-2xl border border-slate-800 bg-gradient-to-br from-emerald-600 to-indigo-700 text-4xl font-semibold text-slate-950">
                  {avatarInitial}
                </div>
              )}
            </div>

            <div className="md:w-2/3">
              {isEditing ? (
                <>
                  <label className="mb-4 block text-sm font-semibold text-slate-300">
                    📧 Email
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`mt-1 ${inputFieldClasses}`}
                    />
                  </label>
                  <label className="mb-4 block text-sm font-semibold text-slate-300">
                    Display Name
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={`mt-1 ${inputFieldClasses}`}
                    />
                  </label>
                  <label className="mb-4 block text-sm font-semibold text-slate-300">
                    📝 Bio / About
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`mt-1 ${textareaClasses}`}
                      rows={4}
                    />
                  </label>
                  <p className="mb-2 text-sm font-semibold text-slate-300">🎶 Favorite Genres (pick up to 3)</p>
                  <div className="mb-4 grid grid-cols-2 gap-2 text-sm text-slate-200 sm:grid-cols-3">
                    {genresList.map((genre) => (
                      <label key={genre} className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/60 px-2 py-1">
                        <input
                          type="checkbox"
                          value={genre}
                          checked={genres.includes(genre)}
                          onChange={() => handleGenreChange(genre)}
                          className="accent-emerald-400"
                        />
                        {genre}
                      </label>
                    ))}
                  </div>
                  <label className="mb-4 block text-sm font-semibold text-slate-300">
                    📷 Upload New Picture
                    <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-slate-300" />
                  </label>
                </>
              ) : (
                <>
                  <p className="mb-3 text-lg font-semibold text-white">{displayName || "No display name yet"}</p>
                  <p className="mb-2 text-sm text-slate-400">{email}</p>
                  <p className="mb-3 text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">About:</span> {description || "No description"}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2 text-xs">
                    {genres.length > 0 ? (
                      genres.map((genre) => (
                        <span key={genre} className="rounded-full border border-slate-700 px-3 py-1 uppercase tracking-wide text-slate-200">
                          {genre}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">No genres selected</span>
                    )}
                  </div>
                </>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold ${
                    isEditing
                      ? "border border-slate-700 text-slate-200 hover:bg-slate-800/60"
                      : "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40 hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0"
                  }`}
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
                {isEditing && (
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0"
                  >
                    Save Changes
                  </button>
                )}
                {formError && (
                  <div className="mt-2 rounded-lg border border-rose-500/60 bg-rose-950/40 px-3 py-2 text-xs text-rose-100">
                    {formError}
                  </div>
                )}
                <button
                  onClick={handleResetPassword}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/60"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/60"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-xl shadow-black/30 space-y-4 sm:p-8">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">My Artist Presence</p>
                <h2 className="text-2xl font-semibold text-white">Artist Page</h2>
              </div>
              {needsProfileSetup && !hasArtistProfile && (
                <span className="text-sm text-emerald-200">Step 2: Create your artist page (optional)</span>
              )}
            </div>
            <p className="text-slate-300 text-sm">
              Share a public page with your shows, contact info, and media so venues and fans can find you.
            </p>
          </div>

          {!hasArtistProfile ? (
            canShowArtistWelcome ? (
              <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                <p className="text-slate-300 text-sm">
                  Create your artist or venue page to showcase your work on Alpine Groove Guide.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={gotoCreateProfile}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0"
                  >
                    Create my artist page
                  </button>
                  {canRestoreProfile && (
                    <button
                      onClick={handleRestoreProfile}
                      disabled={restoreLoading}
                      className={`inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/60 ${
                        restoreLoading ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {restoreLoading ? "Restoring…" : "Restore previous page"}
                    </button>
                  )}
                  {restoreError && canRestoreProfile && (
                    <p className="text-xs text-red-400">{restoreError}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setArtistCardDismissed(true)}
                    className="text-sm text-gray-300 underline hover:text-white text-left"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-900/20 border border-gray-700 rounded-xl p-4">
                <p className="text-sm text-slate-300">
                  Ready later? You can create your artist page whenever you like.
                </p>
                <button
                  onClick={gotoCreateProfile}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0"
                >
                  Create my artist page
                </button>
              </div>
            )
          ) : (
            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xl font-semibold text-white">{artistDisplayName || "Your artist profile"}</p>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${artistStatusClass}`}>
                      {artistStatusLabel}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => router.push(`/artists/${artistSlug}`)}
                    disabled={!canVisitPublicPage}
                    title={canVisitPublicPage ? "View your public page" : "Your page is offline until your trial or subscription is active"}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold ${
                      canVisitPublicPage
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 hover:-translate-y-[1px] hover:bg-purple-500"
                        : "border border-slate-700 text-slate-400"
                    }`}
                  >
                    View Public Page
                  </button>
                  <button
                    onClick={() => router.push(`/artists/edit/${artistSlug}`)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/60"
                  >
                    Manage Artist Profile
                  </button>
                </div>
              </div>

              {!isApproved && (
                <div className="rounded-lg border border-amber-400/60 bg-amber-500/10 p-4 text-sm text-amber-100">
                  🎷 Your artist profile is under review. You’ll be notified when it’s approved.
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-xl shadow-black/30 space-y-4 sm:p-8">
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-wide text-slate-500">Alpine Pro Status</p>
            <h2 className="text-2xl font-semibold text-white">Subscription</h2>
            <p className="text-slate-300 text-sm">
              Your access to Alpine Pro tools, billing state, and trial info.
            </p>
          </div>

          <div className="space-y-3">
            {shouldShowTrialBanner && (
              <TrialBanner trial_ends_at={user?.trial_ends_at} is_pro={user?.pro_active} />
            )}
            {!shouldShowTrialBanner && shouldShowCancelBanner && proCancelledAt && (
              <div className="rounded-md border border-amber-400/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                Your Alpine Pro subscription is scheduled to end on{" "}
                <strong>{proCancelledAt.toLocaleDateString()}</strong>.{" "}
                To keep your profile public and listed, renew your subscription in Billing.
              </div>
            )}
            {canUseProFeatures ? (
              <p className="text-slate-300 text-sm">Alpine Pro is active on your account.</p>
            ) : shouldShowTrialBanner ? (
              <p className="text-slate-300 text-sm">
                Your free trial is active{trialEndDate ? ` until ${trialEndDate}` : ""}. Upgrade to keep your tools after the trial.
              </p>
            ) : (
              <p className="text-slate-300 text-sm">
                You are not currently subscribed to Alpine Pro.
              </p>
            )}
          </div>

          {canUseProFeatures ? (
            <>
              <button
                onClick={handleManageBilling}
                className="inline-flex w-full items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/60"
              >
                Manage subscription
              </button>
              <p className="mt-2 text-xs text-slate-400">
                You can manage or cancel your subscription anytime in the Billing Portal. Pro access continues until the end of your current billing period.
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/upgrade")}
                className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0"
              >
                Upgrade to Alpine Pro
              </button>
              <p className="mt-2 text-xs text-slate-400">
                By upgrading, you agree to our{" "}
                <Link href="/terms" className="underline decoration-emerald-400/70 underline-offset-2 hover:text-emerald-200">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline decoration-emerald-400/70 underline-offset-2 hover:text-emerald-200">
                  Privacy Policy
                </Link>
                . You can cancel anytime in the Billing Portal; Pro access continues until the end of your current billing period.
              </p>
            </>
          )}
        </section>

        <section className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-xl shadow-black/30 space-y-4 sm:p-8">
          <h3 className="font-semibold text-xl text-white">Support Alpine Groove Guide</h3>
          <p className="text-sm text-slate-300">
            Help keep the directory running and discoverable for local artists.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => handleDonate("payment")}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0"
            >
              💵 Send a $7 Tip
            </button>
            <button
              onClick={() => handleDonate("subscription")}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/60"
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
