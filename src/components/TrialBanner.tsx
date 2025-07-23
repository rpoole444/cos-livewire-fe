import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface TrialBannerProps {
  trial_ends_at?: string | null;
  is_pro?: boolean;
  artist_user_id?: number;
}

const TrialBanner: React.FC<TrialBannerProps> = (props) => {
  const { user } = useAuth();
  const isProfileOwner = user?.id === props.artist_user_id;

  const trialEndStr = props.trial_ends_at ?? user?.trial_ends_at;
  const isPro = props.is_pro ?? user?.is_pro;

  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!trialEndStr || isPro) return;

    const updateDaysLeft = () => {
      const now = dayjs();
      const trialEnd = dayjs(trialEndStr);
      const diff = trialEnd.diff(now, 'day');
      setDaysLeft(Math.max(diff, 0));
    };

    updateDaysLeft();
    const interval = setInterval(updateDaysLeft, 60_000);
    return () => clearInterval(interval);
  }, [trialEndStr, isPro]);

  // ⛔ Don't show at all unless it's the profile owner
  if (!isProfileOwner || !trialEndStr || isPro || daysLeft === null) return null;

  const isExpired = daysLeft <= 0;

  return (
    <div
      className={`rounded-md p-3 text-white text-center shadow-md mb-4 text-sm font-medium ${
        isExpired ? 'bg-red-700' : 'bg-blue-700'
      }`}
    >
      {isExpired ? (
        <>
          🔒 <span className="font-semibold">Your Alpine Pro trial has expired.</span>{' '}
          <Link href="/upgrade" className="underline text-yellow-300 hover:text-yellow-200">
            Upgrade now
          </Link>{' '}
          to unlock your profile features.
        </>
      ) : (
        <>
          🎁 <span className="font-semibold">Alpine Pro trial:</span> {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining.{' '}
          <Link href="/upgrade" className="underline font-semibold hover:text-yellow-300">
            Upgrade early →
          </Link>
        </>
      )}
    </div>
  );
};

export default TrialBanner;
