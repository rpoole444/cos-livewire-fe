import dayjs from 'dayjs';

export function isTrialActive(trialEndsAt?: string | null): boolean {
  if (!trialEndsAt) return false;
  return dayjs().isBefore(dayjs(trialEndsAt));
}
