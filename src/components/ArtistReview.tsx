"use client";
import { useEffect, useState } from 'react';
import AdminArtistCard from './AdminArtistCard';
import { getPendingArtists, approveArtist, deleteArtist, updateArtist } from '@/pages/api/artists';
import { Artist, Artists } from '@/interfaces/interfaces';

const ArtistReview: React.FC = () => {
  const [artists, setArtists] = useState<Artists>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('📡 Fetching pending artists...');

        const data = await getPendingArtists();
        console.log('✅ Fetched:', data);

        setArtists(data);
      } catch (err) {
        console.error('Failed to load artists for review', err);
      }
    };
    fetchData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await approveArtist(id);
      setArtists(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Approve error', err);
    }
  };

  const handleDeny = async (slug: string) => {
    try {
      await deleteArtist(slug);
      setArtists(prev => prev.filter(a => a.slug !== slug));
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleSave = async (updated: Artist) => {
    try {
      await updateArtist(updated.slug, updated);
      setArtists(prev => prev.map(a => (a.id === updated.id ? updated : a)));
    } catch (err) {
      console.error('Save error', err);
    }
  };

  return (
    <div className="mt-8">
      {artists.length > 0 ? (
        <ul className="space-y-6">
          {artists.map(a => (
            <li key={a.id} className="bg-white rounded-md shadow-md p-4">
              <AdminArtistCard
                artist={a}
                onApprove={() => handleApprove(a.id)}
                onDeny={() => handleDeny(a.slug)}
                onSave={handleSave}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-300 py-10">
          <p className="text-lg">✅ All clear — no pending artists right now.</p>
        </div>
      )}
    </div>
  );
};

export default ArtistReview;
