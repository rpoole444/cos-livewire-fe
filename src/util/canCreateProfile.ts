// src/util/canCreateProfile.ts
export function canCreateProfile(user?: { pro_active?: boolean; trial_active?: boolean }) {
  return !!user && (user.pro_active || user.trial_active);
}
