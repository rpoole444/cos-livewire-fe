import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const WelcomePage = () => {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();
  const [checkingArtist, setCheckingArtist] = useState(true);
  const [hasArtistProfile, setHasArtistProfile] = useState<boolean | null>(null);

  // Keep the session fresh in case the user just returned from signup/billing.
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/LoginPage");
      return;
    }

    let cancelled = false;

    const checkArtistProfile = async () => {
      setCheckingArtist(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/artists/mine`, {
          credentials: "include",
        });

        if (!res.ok) {
          if (!cancelled) setHasArtistProfile(false);
          return;
        }

        const data = await res.json().catch(() => null);
        if (!cancelled) {
          setHasArtistProfile(!!data?.artist);
        }
      } catch (err) {
        console.error("Failed to check artist profile:", err);
        if (!cancelled) setHasArtistProfile(false);
      } finally {
        if (!cancelled) setCheckingArtist(false);
      }
    };

    checkArtistProfile();
    return () => {
      cancelled = true;
    };
  }, [loading, user, router]);

  if (loading || (user && checkingArtist)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center space-y-2">
          <div className="animate-pulse text-2xl font-semibold">Loading…</div>
          <p className="text-gray-400 text-sm">Getting things ready for you.</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-10 text-center space-y-6">
          <h1 className="text-3xl font-bold">Welcome to Alpine Groove Guide</h1>
          <p className="text-gray-300">
            Share your sound with the Colorado Springs community, keep venue contacts in
            the know, and unlock tools that help you grow your audience.
          </p>

          {hasArtistProfile ? (
            <>
              <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 text-sm text-green-200">
                You already have an artist page — jump back into your dashboard to keep building momentum.
              </div>
              <Link
                href="/UserProfile"
                className="inline-flex justify-center items-center px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 font-semibold transition"
              >
                Go to your dashboard
              </Link>
            </>
          ) : (
            <>
              <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 text-sm text-blue-200">
                Next step: set up your artist page so fans and venues can discover you.
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/artist-signup"
                  className="inline-flex justify-center items-center px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-semibold transition text-white"
                >
                  Create your artist page
                </Link>
                <Link
                  href="/UserProfile"
                  className="text-sm text-gray-300 underline hover:text-white"
                >
                  Skip for now, go to your dashboard →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;

