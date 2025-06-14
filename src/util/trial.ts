import dayjs from 'dayjs';

export const isTrialActive = (trialEndsAt?: string | null) =>
  !!trialEndsAt && dayjs().isBefore(dayjs(trialEndsAt));
