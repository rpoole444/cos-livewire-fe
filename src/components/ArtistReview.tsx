"use client";
import { useEffect, useState } from 'react';
import AdminArtistCard from './AdminArtistCard';
import { getPendingArtists, approveArtist, deleteArtist, updateArtist } from '@/pages/api/artists';
import { Artist, Artists } from '@/interfaces/interfaces';

interface ArtistReviewProps {
  onCountChange?: (count: number) => void;
}

const ArtistReview: React.FC<ArtistReviewProps> = ({ onCountChange }) => {
  const [artists, setArtists] = useState<Artists>([]);
  const [proFilter, setProFilter] = useState<'all' | 'true' | 'false'>('all');
  const [approvedFilter, setApprovedFilter] = useState<'all' | 'true' | 'false'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const data = await getPendingArtists();
        setArtists(data);
        onCountChange?.(data.length);
      } catch (err) {
        console.error('Failed to load artists for review', err);
        setErrorMessage('Unable to load artist submissions. Please refresh or try again in a moment.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [onCountChange]);

  const handleApprove = async (id: number) => {
    try {
      await approveArtist(id);
      setArtists(prev => {
        const next = prev.filter(a => a.id !== id);
        onCountChange?.(next.length);
        return next;
      });
    } catch (err) {
      console.error('Approve error', err);
        setErrorMessage('Unable to approve that Pro profile.');
    }
  };

  const handleDeny = async (slug: string) => {
    try {
      await deleteArtist(slug);
      setArtists(prev => {
        const next = prev.filter(a => a.slug !== slug);
        onCountChange?.(next.length);
        return next;
      });
    } catch (err) {
      console.error('Delete error', err);
      setErrorMessage('Unable to deny that Pro profile.');
    }
  };

  const handleSave = async (updated: Artist) => {
    try {
      await updateArtist(updated.slug, updated);
      setArtists(prev => prev.map(a => (a.id === updated.id ? updated : a)));
    } catch (err) {
      console.error('Save error', err);
      setErrorMessage('Unable to save profile changes.');
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
      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </div>
      )}
      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400">Pro status</label>
          <select
            value={proFilter}
            onChange={e => setProFilter(e.target.value as 'all' | 'true' | 'false')}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
          >
            <option value="all">All</option>
            <option value="true">Pro</option>
            <option value="false">Free</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400">Approval</label>
          <select
            value={approvedFilter}
            onChange={e => setApprovedFilter(e.target.value as 'all' | 'true' | 'false')}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
          >
            <option value="all">All</option>
            <option value="true">Approved</option>
            <option value="false">Pending</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400">Sort</label>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-slate-100"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-10 text-center text-sm text-slate-300">
          Loading Pro page submissions...
        </div>
      ) : filteredArtists.length > 0 ? (
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
