import React from 'react';
import { useRouter } from 'next/router';

interface EventCardProps {
  id: number;
  title: string;
  genre: string;
  venueName: string;
  date: string;
  time: string;
}

const FaveEventCard: React.FC<EventCardProps> = ({ id, title, genre, venueName, date, time }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/eventRouter/${id}`);
  };

  return (
    <div onClick={handleClick} className="p-4 bg-gray-100 shadow-md rounded-md cursor-pointer hover:bg-gray-200 transition duration-200">
      <h3 className="text-lg font-semibold truncate">
        {title.length > 20 ? `${title.substring(0, 20)}...` : title}
      </h3>
      <p className="text-sm text-gray-600">{genre}</p>
      <p className="text-sm text-gray-600">{venueName}</p>
      <p className="text-sm text-gray-600">{new Date(date).toLocaleDateString()} {time}</p>
    </div>
  );
};

export default FaveEventCard;
