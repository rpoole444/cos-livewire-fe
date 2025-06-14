import dayjs from 'dayjs';

export function isTrialActive(trialEndsAt?: string | null): boolean {
  if (!trialEndsAt) return false;

  const trialEnd = dayjs(trialEndsAt);
  if (!trialEnd.isValid()) return false;

  return trialEnd.isAfter(dayjs());
}
