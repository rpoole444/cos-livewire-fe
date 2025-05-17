import React from 'react';
import { useRouter } from 'next/router';
import { parseMSTDate } from '@/util/dateHelper';
import Link from 'next/link';

interface EventCardProps {
  id: number;
  title: string;
  genre: string;
  venueName: string;
  date: string;
  startTime: string;
  formatTime: (timeString: string) => string;
}

const FaveEventCard: React.FC<EventCardProps> = ({ id, title, genre, venueName, date, startTime, formatTime }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/eventRouter/${id}`);
  };

  return (
    <Link href={`/eventRouter/${id}`} passHref>
      <a className="block p-3 mb-3 bg-gray-100 shadow-sm rounded-md cursor-pointer hover:bg-gray-200 transition text-sm">
        <h3 className="text-base font-semibold text-black truncate mb-1">
          {title.length > 30 ? `${title.substring(0, 30)}...` : title}
        </h3>
        <p className="text-gray-700">{genre}</p>
        <p className="text-gray-600">{venueName}</p>
        <p className="text-gray-500">📅 {parseMSTDate(date).toLocaleDateString()}</p>
        <p className="text-gray-500">🕒 {formatTime(startTime)}</p>
      </a>
    </Link>
  );
};

export default FaveEventCard;
