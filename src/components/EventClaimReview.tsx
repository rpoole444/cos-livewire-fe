"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getEventClaimRequests, reviewEventClaim } from "@/pages/api/route";

interface EventClaimRequest {
  id: number;
  event_id: number;
  artist_profile_id: number;
  requested_by_user_id: number;
  status: string;
  created_at?: string;
  event_title: string;
  event_slug: string;
  event_date: string;
  event_start_time?: string | null;
  event_venue_name?: string | null;
  event_source_label?: string | null;
  current_artist_profile_id?: number | null;
  current_artist_display_name?: string | null;
  artist_display_name: string;
  artist_slug: string;
  requester_first_name?: string | null;
  requester_last_name?: string | null;
  requester_email?: string | null;
}

interface EventClaimReviewProps {
  onCountChange?: (count: number) => void;
}

const formatDate = (value?: string) => {
  if (!value) return "Date TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const EventClaimReview = ({ onCountChange }: EventClaimReviewProps) => {
  const [claims, setClaims] = useState<EventClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  useEffect(() => {
    const loadClaims = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const data = await getEventClaimRequests();
        const rows = Array.isArray(data) ? data : [];
        setClaims(rows);
        onCountChange?.(rows.length);
      } catch (error) {
        console.error("Failed to load event claim requests", error);
        setErrorMessage("Unable to load event claim requests.");
      } finally {
        setLoading(false);
      }
    };

    loadClaims();
  }, [onCountChange]);

  const handleReview = async (claimId: number, approve: boolean) => {
    try {
      setReviewingId(claimId);
      await reviewEventClaim(claimId, approve);
      setClaims((prev) => {
        const next = prev.filter((claim) => claim.id !== claimId);
        onCountChange?.(next.length);
        return next;
      });
    } catch (error) {
      console.error("Failed to review event claim", error);
      setErrorMessage(error instanceof Error ? error.message : "Unable to review claim request.");
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="mt-8">
      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </div>
      )}
      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-10 text-center text-sm text-slate-300">
          Loading event claim requests...
        </div>
      ) : claims.length > 0 ? (
        <ul className="space-y-4">
          {claims.map((claim) => (
            <li key={claim.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-slate-100">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                      Event claim request
                    </p>
                    <h3 className="mt-1 text-xl font-semibold">{claim.event_title}</h3>
                    <p className="text-sm text-slate-400">
                      {formatDate(claim.event_date)}
                      {claim.event_start_time ? ` at ${claim.event_start_time}` : ""}
                      {claim.event_venue_name ? ` • ${claim.event_venue_name}` : ""}
                    </p>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                      <p className="text-xs uppercase tracking-widest text-slate-500">Requested artist</p>
                      <Link href={`/artists/${claim.artist_slug}`} className="mt-1 block font-semibold text-emerald-200 hover:text-emerald-100">
                        {claim.artist_display_name}
                      </Link>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                      <p className="text-xs uppercase tracking-widest text-slate-500">Requester</p>
                      <p className="mt-1 font-semibold">
                        {[claim.requester_first_name, claim.requester_last_name].filter(Boolean).join(" ") || "Unknown user"}
                      </p>
                      {claim.requester_email && <p className="text-slate-400">{claim.requester_email}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {claim.event_source_label && (
                      <span className="rounded-full border border-copper/40 bg-copper/10 px-3 py-1 font-semibold uppercase tracking-widest text-mist">
                        {claim.event_source_label}
                      </span>
                    )}
                    {claim.current_artist_display_name && (
                      <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 font-semibold text-amber-100">
                        Already linked to {claim.current_artist_display_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:flex-col">
                  <Link
                    href={`/eventRouter/${claim.event_slug}`}
                    className="inline-flex justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-300 hover:text-white"
                  >
                    View event
                  </Link>
                  <button
                    type="button"
                    disabled={reviewingId === claim.id}
                    onClick={() => handleReview(claim.id, true)}
                    className="inline-flex justify-center rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
                  >
                    Approve claim
                  </button>
                  <button
                    type="button"
                    disabled={reviewingId === claim.id}
                    onClick={() => handleReview(claim.id, false)}
                    className="inline-flex justify-center rounded-lg border border-rose-500/60 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/10 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-300 py-10">
          <p className="text-lg">All clear — no pending event claims right now.</p>
        </div>
      )}
    </div>
  );
};

export default EventClaimReview;
