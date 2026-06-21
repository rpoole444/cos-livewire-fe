import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getEvents } from "../api/route";
import EventDetailCard from "@/components/EventDetailCard";
import WelcomeUser from "@/components/WelcomeUser";
import UpcomingShows from "@/components/UpcomingShows";
import EventQualityChecklist from "@/components/EventQualityChecklist";
import LoginForm from "@/components/login";
import RegistrationForm from "@/components/registration";
import { Artist, Event } from "@/interfaces/interfaces";
import { useAuth } from "@/context/AuthContext";
import { FaFacebookF, FaTwitter, FaLink, FaLocationArrow, FaShareAlt } from "react-icons/fa";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import { deleteEvent, fetchEventDetailsBySlug } from "../api/route";
import { canDeleteEvent, canManageEvent } from "@/util/eventPermissions";

type EventClaimStatus = {
  id: number;
  event_id: number;
  artist_profile_id: number;
  status: "pending" | "approved" | "rejected";
  event_title: string;
  event_slug: string;
  artist_display_name: string;
  admin_notes?: string | null;
};

interface Props {
  event: Event;
  events: Event[];
}

const EventDetailPage = ({ event, events }: Props) => {
  const { user } = useAuth();
  const [currentEvent, setCurrentEvent] = useState<Event>(event);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [managedProfiles, setManagedProfiles] = useState<Artist[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | "">("");
  const [claimStatus, setClaimStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [claimMessage, setClaimMessage] = useState("");
  const [claimImageHint, setClaimImageHint] = useState<string | null>(null);
  const [myClaims, setMyClaims] = useState<EventClaimStatus[]>([]);
  const router = useRouter();
  const canManage = canManageEvent(user, currentEvent);
  const canDelete = canDeleteEvent(user, currentEvent);
  const artistProfiles = useMemo(
    () => managedProfiles.filter((profile) => (profile.profile_type || "artist") === "artist"),
    [managedProfiles],
  );
  const alreadyClaimedByViewer = Boolean(
    user && currentEvent.claimed_artist?.user_id === user.id,
  );
  const eventClaimsForViewer = useMemo(
    () => myClaims.filter((claim) => Number(claim.event_id) === Number(currentEvent.id)),
    [currentEvent.id, myClaims],
  );
  const pendingClaimForViewer = eventClaimsForViewer.find((claim) => claim.status === "pending");
  const rejectedClaimForViewer = eventClaimsForViewer.find((claim) => claim.status === "rejected");
  const pageTitle = currentEvent?.title
    ? `${currentEvent.title} – Event Details – Alpine Groove Guide`
    : "Event Details – Alpine Groove Guide";
  const siteBaseUrl = "https://app.alpinegrooveguide.com";
  const eventUrl = `${siteBaseUrl}/eventRouter/${currentEvent.slug}`;
  const defaultSocialImage = `${siteBaseUrl}/alpine-groove-social-cover.png`;
  const rawEventImage = currentEvent.display_image_url || currentEvent.poster;
  const eventImage =
    rawEventImage && rawEventImage.trim() && !["tbd", "tba", "none", "null"].includes(rawEventImage.trim().toLowerCase())
      ? rawEventImage.startsWith("http")
        ? rawEventImage
        : `${siteBaseUrl}${rawEventImage}`
      : defaultSocialImage;
  const eventDescription = currentEvent.description
    ? currentEvent.description.slice(0, 180)
    : [
        currentEvent.venue_name || currentEvent.location,
        currentEvent.date ? new Date(currentEvent.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null,
      ].filter(Boolean).join(" • ") || "Discover this Front Range live music event on Alpine Groove Guide.";

  useEffect(() => {
    setCurrentEvent(event);
  }, [event]);

  useEffect(() => {
    if (!user) {
      setManagedProfiles([]);
      setSelectedProfileId("");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [profileRes, claimsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/mine`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/claims/mine`, { credentials: "include" }),
        ]);
        if (!profileRes.ok) return;
        const data = await profileRes.json();
        const claimsData = claimsRes.ok ? await claimsRes.json() : [];
        const profiles = Array.isArray(data.profiles) ? data.profiles : [];
        if (!cancelled) {
          setManagedProfiles(profiles);
          setMyClaims(Array.isArray(claimsData) ? claimsData : []);
          const firstArtist = profiles.find((profile: Artist) => (profile.profile_type || "artist") === "artist");
          setSelectedProfileId(firstArtist?.id || "");
        }
      } catch (error) {
        console.error("Unable to load managed profiles", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const switchAuthMode = () => {
    setAuthMode((prev) => (prev === "login" ? "register" : "login"));
  };

  const getDirections = () => {
    if (!currentEvent?.address) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentEvent.address)}`;
    window.open(url, "_blank");
  };

  const handleClaimEvent = async () => {
    if (!selectedProfileId) {
      setClaimStatus("error");
      setClaimMessage("Choose the artist profile that should claim this event.");
      return;
    }

    try {
      setClaimStatus("loading");
      setClaimMessage("");
      setClaimImageHint(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${currentEvent.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ artist_profile_id: selectedProfileId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Unable to claim this event.");
      }

      setCurrentEvent((prev) => ({
        ...prev,
        ...data.event,
      }));
      if (data.claim) {
        setMyClaims((prev) => [
          {
            ...data.claim,
            event_title: currentEvent.title,
            event_slug: currentEvent.slug,
            artist_display_name:
              artistProfiles.find((profile) => Number(profile.id) === Number(selectedProfileId))?.display_name ||
              "Your artist profile",
          },
          ...prev.filter((claim) => Number(claim.id) !== Number(data.claim.id)),
        ]);
      }
      setClaimStatus("success");
      setClaimMessage(
        data.prompt ||
          "Claim request sent. Once an admin approves it, you can edit this event and make the listing stronger.",
      );
      setClaimImageHint(data.image_hint || null);
    } catch (error) {
      setClaimStatus("error");
      setClaimMessage(error instanceof Error ? error.message : "Unable to claim this event.");
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await deleteEvent(currentEvent.id);
      router.push("/");
    } catch (err) {
      console.error("Failed to delete event", err);
      alert("Unable to delete that event. Please try again.");
    }
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={eventDescription} />
        <meta property="og:site_name" content="Alpine Groove Guide" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={eventDescription} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={eventUrl} />
        <meta property="og:image" content={eventImage} />
        <meta property="og:image:secure_url" content={eventImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="628" />
        <meta property="og:image:alt" content={`${currentEvent.title} on Alpine Groove Guide`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={eventDescription} />
        <meta name="twitter:image" content={eventImage} />
        <link rel="canonical" href={eventUrl} />
      </Head>

      <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_55%)]" />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:gap-12 lg:py-16">
          <section className="flex-1 space-y-6">
            <Link href="/" className="text-sm text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline">
              ← Back to all events
            </Link>
            <EventDetailCard event={currentEvent} user={user} expandDescription />
            <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 shadow-xl shadow-black/30 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Artist claim</p>
              {currentEvent.claimed_artist ? (
                <div className="mt-3 space-y-3">
                  <h2 className="text-xl font-semibold text-slate-50">
                    Connected to {currentEvent.claimed_artist.display_name}
                  </h2>
                  <p className="text-sm text-slate-300">
                    This event is attached to the artist profile and will appear on that artist&apos;s schedule and embeds.
                  </p>
                  {alreadyClaimedByViewer && (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm text-emerald-50">
                        <p className="font-semibold">Claim approved.</p>
                        <p className="mt-1">You can now edit this listing and make it stronger.</p>
                      </div>
                      <Link
                        href={`/events/edit/${currentEvent.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                      >
                        Improve this listing
                      </Link>
                    </div>
                  )}
                </div>
              ) : user ? (
                <div className="mt-3 space-y-4">
                  <h2 className="text-xl font-semibold text-slate-50">Is this your gig?</h2>
                  <p className="text-sm text-slate-300">
                    Claim it with your artist profile so it appears on your schedule and you can improve the public listing.
                  </p>
                  {pendingClaimForViewer ? (
                    <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-50">
                      <p className="font-semibold">Claim pending.</p>
                      <p className="mt-1">
                        Your request for {pendingClaimForViewer.artist_display_name} is waiting for admin approval.
                      </p>
                    </div>
                  ) : claimStatus === "success" ? (
                    <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm text-emerald-50">
                      Your claim request is waiting for admin approval.
                    </div>
                  ) : artistProfiles.length > 0 ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Artist profile
                      </label>
                      <select
                        value={selectedProfileId}
                        onChange={(e) => setSelectedProfileId(e.target.value ? Number(e.target.value) : "")}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                      >
                        <option value="">Choose artist profile</option>
                        {artistProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.display_name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleClaimEvent}
                        disabled={claimStatus === "loading"}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {claimStatus === "loading" ? "Claiming…" : "Claim this event"}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-300">
                      You need an artist profile before you can claim gigs.
                      <Link href="/artist-signup" className="ml-2 font-semibold text-emerald-300 hover:text-emerald-200">
                        Create an artist page
                      </Link>
                    </div>
                  )}
                  {rejectedClaimForViewer && (
                    <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                      <p className="font-semibold">Claim rejected.</p>
                      <p className="mt-1">
                        This request was not approved{rejectedClaimForViewer.admin_notes ? `: ${rejectedClaimForViewer.admin_notes}` : "."}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <h2 className="text-xl font-semibold text-slate-50">Is this your gig?</h2>
                  <p className="text-sm text-slate-300">
                    Sign in with your artist account to claim this event, add it to your profile, and improve the listing.
                  </p>
                </div>
              )}
              {claimMessage && (
                <div
                  className={`mt-4 rounded-2xl border p-4 text-sm ${
                    claimStatus === "error"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
                      : "border-emerald-400/40 bg-emerald-400/10 text-emerald-50"
                  }`}
                >
                  <p>{claimMessage}</p>
                  {claimImageHint && <p className="mt-2 font-semibold">{claimImageHint}</p>}
                </div>
              )}
            </section>
            {canManage && (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/events/edit/${currentEvent.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/60 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                  Edit event
                </Link>
                {canDelete && (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-500/60 px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:border-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete event
                  </button>
                )}
              </div>
            )}
            {canManage && <EventQualityChecklist event={currentEvent} canEdit />}

            {currentEvent.description && (
              <section className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-xl shadow-black/30 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">About this show</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300 whitespace-pre-line">{currentEvent.description}</p>
              </section>
            )}

            <section className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-xl shadow-black/30 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Spread the word</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {currentEvent.address && (
                  <button
                    onClick={getDirections}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:-translate-y-[1px] hover:bg-emerald-400 active:translate-y-0 sm:flex-none"
                  >
                    <FaLocationArrow /> Get directions
                  </button>
                )}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: currentEvent.title,
                        text: currentEvent.description?.slice(0, 100),
                        url: `https://app.alpinegrooveguide.com/share/${currentEvent.slug}`,
                      });
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-emerald-400/70 hover:bg-slate-900/60"
                >
                  <FaShareAlt /> Share
                </button>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    `https://app.alpinegrooveguide.com/share/${currentEvent.slug}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-emerald-400/70 hover:bg-slate-900/60"
                >
                  <FaFacebookF /> Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    `https://app.alpinegrooveguide.com/share/${currentEvent.slug}`,
                  )}&text=${encodeURIComponent(currentEvent.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-emerald-400/70 hover:bg-slate-900/60"
                >
                  <FaTwitter /> Share on X
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://app.alpinegrooveguide.com/share/${currentEvent.slug}`);
                    alert("Link copied to clipboard!");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-emerald-400/70 hover:bg-slate-900/60"
                >
                  <FaLink /> Copy link
                </button>
              </div>
            </section>
          </section>

          <aside className="w-full space-y-6 lg:w-[360px]">
            {user ? (
              <div className="space-y-6">
                <WelcomeUser />
                <UpcomingShows
                  user={user}
                  userGenres={
                    Array.isArray(user.top_music_genres)
                      ? user.top_music_genres
                      : JSON.parse(user.top_music_genres || "[]")
                  }
                  events={events}
                />
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-xl shadow-black/30">
                {authMode === "login" ? (
                  <div className="space-y-6">
                    <div className="space-y-2 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
                        Alpine Groove Guide
                      </p>
                      <h2 className="text-xl font-semibold text-slate-50">Welcome back</h2>
                      <p className="text-sm text-slate-400">
                        Sign in to RSVP, save shows, and manage Pro pages for your artist, venue, or promoter series.
                      </p>
                    </div>
                    <LoginForm setAuthMode={switchAuthMode} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
                        Alpine Groove Guide
                      </p>
                      <h2 className="text-xl font-semibold text-slate-50">Create an account</h2>
                      <p className="text-sm text-slate-400">
                        Build your Pro page as an artist, venue, or promoter and see your shows featured.
                      </p>
                    </div>
                    <RegistrationForm setAuthMode={switchAuthMode} />
                  </div>
                )}
                <button
                  onClick={switchAuthMode}
                  className="mt-6 w-full text-center text-xs text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
                >
                  {authMode === "login" ? "Need an account? Register" : "Already have an account? Login"}
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug;

  if (!slug || typeof slug !== "string") {
    console.warn("Invalid or missing event slug:", slug);
    return { notFound: true };
  }

  try {
    const event = await fetchEventDetailsBySlug(slug);
    const allEvents = await getEvents();

    if (!event || typeof event.id !== "number") {
      console.warn("Invalid event response");
      return { notFound: true };
    }

    return {
      props: {
        event,
        events: allEvents.filter((e: Event) => e.is_approved),
      },
    };
  } catch (err) {
    console.error("getServerSideProps failed:", err);
    return { notFound: true };
  }
};

export default EventDetailPage;
