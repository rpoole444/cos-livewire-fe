import { UserType } from "@/types";
import { isActivePro } from "./isActivePro";
import { isTrialActive } from "./isTrialActive";

export const COMMUNITY_ARTIST_ACCESS_END_DATE = "2026-12-31";
export const COMMUNITY_ARTIST_ACCESS_LABEL = "Free community artist pages through 2026";

const COMMUNITY_ARTIST_ACCESS_END_UTC = Date.UTC(2027, 0, 1);

export const isCommunityArtistAccessActive = (now: Date = new Date()): boolean => {
  return now.getTime() < COMMUNITY_ARTIST_ACCESS_END_UTC;
};

export const hasArtistProfileAccess = (user?: UserType | null): boolean => {
  return Boolean(
    isCommunityArtistAccessActive() ||
      (user && (isActivePro(user) || isTrialActive(user.trial_ends_at)))
  );
};
