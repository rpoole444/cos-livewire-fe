// src/util/canCreateProfile.ts
import { isCommunityArtistAccessActive } from "./communityAccess";

export function canCreateProfile(user?: { pro_active?: boolean; trial_active?: boolean }) {
  return !!user && (isCommunityArtistAccessActive() || user.pro_active || user.trial_active);
}
