import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ArtistRestorePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/LoginPage?redirect=/artist-restore');
      return;
    }

    const restore = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/artists/${user.id}/restore`, {
          method: 'PUT',
          credentials: 'include',
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.message || 'Failed to restore profile.');
          return;
        }

        const data = await res.json();
        const slug = data.slug;
        if (slug) {
          router.replace(`/artists/${slug}`);
        } else {
          setMessage('Profile restored successfully!');
        }
      } catch (err) {
        console.error('Restore profile error:', err);
        setError('An error occurred while restoring your profile.');
      }
    };

    restore();
  }, [loading, user, router]);

  if (loading) {
    return <div className="text-white text-center mt-20">Loading...</div>;
  }

  return (
    <div className="text-white text-center mt-20">
      {error && <p className="text-red-400">{error}</p>}
      {message && <p>{message}</p>}
      {!error && !message && <p>Restoring your profile...</p>}
    </div>
  );
}
