"use client";
import { useEffect, useState } from 'react';
import AdminArtistCard from './AdminArtistCard';
import { getPendingArtists, approveArtist, deleteArtist, updateArtist } from '@/pages/api/artists';
import { Artist, Artists } from '@/interfaces/interfaces';

const ArtistReview: React.FC = () => {
  const [artists, setArtists] = useState<Artists>([]);
  const [proFilter, setProFilter] = useState<'all' | 'true' | 'false'>('all');
  const [approvedFilter, setApprovedFilter] = useState<'all' | 'true' | 'false'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

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

  const filteredArtists = artists
    .filter(a => (proFilter === 'all' || String(!!a.is_pro) === proFilter))
    .filter(a => (approvedFilter === 'all' || String(!!a.is_approved) === approvedFilter))
    .sort((a, b) => {
      if (!a.created_at || !b.created_at) return 0;
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === 'oldest' ? diff : -diff;
    });

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="mr-2">Pro</label>
          <select
            value={proFilter}
            onChange={e => setProFilter(e.target.value as 'all' | 'true' | 'false')}
            className="text-black p-1 rounded"
          >
            <option value="all">All</option>
            <option value="true">Pro</option>
            <option value="false">Free</option>
          </select>
        </div>
        <div>
          <label className="mr-2">Approved</label>
          <select
            value={approvedFilter}
            onChange={e => setApprovedFilter(e.target.value as 'all' | 'true' | 'false')}
            className="text-black p-1 rounded"
          >
            <option value="all">All</option>
            <option value="true">Approved</option>
            <option value="false">Pending</option>
          </select>
        </div>
        <div>
          <label className="mr-2">Sort</label>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="text-black p-1 rounded"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>
      {filteredArtists.length > 0 ? (
        <ul className="space-y-6">
          {filteredArtists.map(a => (
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
