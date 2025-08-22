// src/util/canCreateProfile.ts
export function canCreateProfile(user?: { is_pro?: boolean; trial_active?: boolean }) {
  return !!user && (user.is_pro || user.trial_active);
}
