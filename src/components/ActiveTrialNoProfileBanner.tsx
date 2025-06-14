import React from 'react';

const ActiveTrialNoProfileBanner: React.FC = () => {
  return (
    <div className="rounded-md p-3 text-white text-center shadow-md mb-4 text-sm font-medium bg-orange-700">
      🎁 <span className="font-semibold">Alpine Pro trial active:</span> Create or restore your artist profile to access the dashboard.
    </div>
  );
};

export default ActiveTrialNoProfileBanner;
