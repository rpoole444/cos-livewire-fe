import React from 'react';
import { COMMUNITY_ARTIST_ACCESS_LABEL, isCommunityArtistAccessActive } from '@/util/communityAccess';

const ActiveTrialNoProfileBanner: React.FC = () => {
  const communityAccessActive = isCommunityArtistAccessActive();

  return (
    <div className="rounded-md p-3 text-white text-center shadow-md mb-4 text-sm font-medium bg-orange-700">
      🎁 <span className="font-semibold">{communityAccessActive ? COMMUNITY_ARTIST_ACCESS_LABEL : 'Alpine Pro trial active'}:</span>{' '}
      Create or restore your Pro page (artist, venue, or promoter) to access the dashboard.
    </div>
  );
};

export default ActiveTrialNoProfileBanner;
