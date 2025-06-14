import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface TrialBannerProps {
  trial_ends_at?: string | null;
  is_pro?: boolean;
}

const TrialBanner: React.FC<TrialBannerProps> = (props) => {
  const { user } = useAuth();

  const trialEndStr = props.trial_ends_at ?? user?.trial_ends_at;
  const isPro = props.is_pro ?? user?.is_pro;

  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!trialEndStr || isPro) return;

    const updateDaysLeft = () => {
      const now = dayjs();
      const trialEnd = dayjs(trialEndStr);
      const diff = trialEnd.diff(now, 'day');
      setDaysLeft(diff);
    };

    updateDaysLeft();
    const interval = setInterval(updateDaysLeft, 60_000); // update every 60 seconds
    return () => clearInterval(interval);
  }, [trialEndStr, isPro]);

  if (!trialEndStr || isPro || daysLeft === null) return null;

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
          🎁 <span className="font-semibold">Alpine Pro trial:</span> {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining.
        </>
      )}
    </div>
  );
};

export default TrialBanner;
