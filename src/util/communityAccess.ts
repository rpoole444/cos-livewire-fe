import { UserType } from "@/types";
import { isActivePro } from "./isActivePro";
import { isTrialActive } from "./isTrialActive";

export const COMMUNITY_ARTIST_ACCESS_END_DATE = null;
export const COMMUNITY_ARTIST_ACCESS_LABEL = "Free community artist pages are open now";

export const isCommunityArtistAccessActive = (now: Date = new Date()): boolean => {
  return true;
};

export const hasArtistProfileAccess = (user?: UserType | null): boolean => {
  return Boolean(
    isCommunityArtistAccessActive() ||
      (user && (isActivePro(user) || isTrialActive(user.trial_ends_at)))
  );
};
