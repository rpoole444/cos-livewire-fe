import { Event, CustomEvent } from "@/interfaces/interfaces";

type EventTrustInput = Partial<Pick<
  Event | CustomEvent,
  | "source"
  | "source_label"
  | "claimed_artist"
  | "artist_profile_id"
  | "venue_profile_id"
  | "venue_profile_user_id"
  | "user_id"
  | "claimed_by_user_id"
  | "last_edited_by_user_id"
>>;

export type EventTrustTone = "emerald" | "gold" | "copper" | "blue" | "slate";

export type EventTrustLabel = {
  key: string;
  label: string;
  tone: EventTrustTone;
  priority: number;
};

const normalizeSourceName = (source?: string | null, sourceLabel?: string | null) => {
  const label = String(sourceLabel || "").trim();
  if (label) {
    return label
      .replace(/^provided by\s+/i, "")
      .replace(/^imported from\s+/i, "")
      .trim();
  }

  const sourceValue = String(source || "").trim();
  if (!sourceValue) return "";
  return sourceValue
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const getEventTrustLabels = (event: EventTrustInput): EventTrustLabel[] => {
  const labels: EventTrustLabel[] = [];
  const source = String(event.source || "").trim().toLowerCase();
  const sourceName = normalizeSourceName(event.source, event.source_label);

  if (event.claimed_artist || event.artist_profile_id) {
    labels.push({
      key: "claimed-artist",
      label: "Claimed by artist",
      tone: "emerald",
      priority: 10,
    });
  }

  if (
    event.venue_profile_id &&
    event.venue_profile_user_id &&
    event.claimed_by_user_id &&
    Number(event.venue_profile_user_id) === Number(event.claimed_by_user_id)
  ) {
    labels.push({
      key: "venue-verified",
      label: "Verified by venue",
      tone: "emerald",
      priority: 20,
    });
  } else if (event.venue_profile_id) {
    labels.push({
      key: "venue-linked",
      label: "Venue linked",
      tone: "blue",
      priority: 25,
    });
  }

  if (sourceName) {
    const isAgg = /alpine groove guide|agg/i.test(sourceName);
    labels.push({
      key: "source",
      label: source === "profile" && isAgg ? "Added by Alpine Groove Guide" : `Imported from ${sourceName}`,
      tone: isAgg ? "gold" : "copper",
      priority: 30,
    });
  } else if (event.user_id) {
    labels.push({
      key: "community",
      label: "Community submitted",
      tone: "blue",
      priority: 40,
    });
  }

  if (event.last_edited_by_user_id && !labels.some((label) => label.key === "claimed-artist")) {
    labels.push({
      key: "updated",
      label: "Recently updated",
      tone: "slate",
      priority: 50,
    });
  }

  if (!labels.length) {
    labels.push({
      key: "pending-verification",
      label: "Pending verification",
      tone: "slate",
      priority: 100,
    });
  }

  return labels
    .sort((a, b) => a.priority - b.priority)
    .filter((label, index, all) => all.findIndex((item) => item.key === label.key) === index);
};

export const getPrimaryEventTrustLabel = (event: EventTrustInput) => getEventTrustLabels(event)[0];

export const shouldShowPublicClaimCta = (event: EventTrustInput) => (
  !event.claimed_artist && !event.artist_profile_id
);
