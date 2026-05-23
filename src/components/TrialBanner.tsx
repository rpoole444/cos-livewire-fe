// components/TrialBanner.tsx
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { COMMUNITY_ARTIST_ACCESS_LABEL, isCommunityArtistAccessActive } from '@/util/communityAccess';

interface TrialBannerProps {
  trial_ends_at?: string | null;
  is_pro?: boolean;
  artist_user_id?: number;
}

const TrialBanner: React.FC<TrialBannerProps> = (props) => {
  const { user } = useAuth();

  const isOwner = props.artist_user_id ? user?.id === props.artist_user_id : true;
  const trialEndStr = props.trial_ends_at ?? user?.trial_ends_at ?? null;
  const isPro = (props.is_pro ?? user?.pro_active) === true;
  const communityAccessActive = isCommunityArtistAccessActive();

  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!trialEndStr || isPro) return;
    const tick = () => {
      const diff = dayjs(trialEndStr).diff(dayjs(), 'day');
      setDaysLeft(Math.max(diff, 0));
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [trialEndStr, isPro]);

  // show only to the profile owner, only if a trial end exists, only if not pro
  if (!isOwner || !trialEndStr || isPro || daysLeft === null) return null;

  const isExpired = dayjs().isAfter(dayjs(trialEndStr), 'day');

  if (isExpired && communityAccessActive) {
    return (
      <div className="rounded-md p-3 text-white text-center shadow-md mb-4 text-sm font-medium bg-emerald-700">
        🎁 <span className="font-semibold">{COMMUNITY_ARTIST_ACCESS_LABEL}.</span>{' '}
        Your trial ended, but artist page access remains open during the community access window.
      </div>
    );
  }

  return (
    <div className={`rounded-md p-3 text-white text-center shadow-md mb-4 text-sm font-medium ${
      isExpired ? 'bg-red-700' : 'bg-blue-700'
    }`}>
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
