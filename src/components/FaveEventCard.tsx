import React from 'react';
import { parseMSTDate } from '@/util/dateHelper';
import Link from 'next/link';

interface EventCardProps {
  id: number;
  title: string;
  genre: string;
  venueName: string;
  date: string;
  startTime: string;
  slug:string
  formatTime: (timeString: string) => string;
}

const FaveEventCard: React.FC<EventCardProps> = ({ title, genre, venueName, date, slug, startTime, formatTime }) => {
  return (
    <Link
      href={`/eventRouter/${slug}`}
      className="mb-3 block rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm shadow-sm transition hover:border-emerald-400/60 hover:bg-slate-900"
    >
      <h3 className="mb-2 truncate text-base font-semibold text-white">
        {title.length > 30 ? `${title.substring(0, 30)}...` : title}
      </h3>
  
      {genre && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">{genre}</p>}
      <p className="mt-1 text-slate-300">{venueName}</p>
      <p className="mt-2 text-slate-400">
        {parseMSTDate(date).toLocaleDateString()}
      </p>
      <p className="text-slate-400">{formatTime(startTime)}</p>
    </Link>
  );  
};

export default FaveEventCard;
