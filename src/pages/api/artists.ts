const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';


export async function createArtistProfile(artistData: any) {
  try {
    const mineRes = await fetch(`${API_BASE_URL}/api/artists/mine`, {
      credentials: 'include',
    });
    if (mineRes.ok) {
      const mine = await mineRes.json().catch(() => null);
      if (mine?.artist && !mine.artist.deleted_at) {
        throw new Error('You already have an artist profile. Manage it from your dashboard.');
      }
    }
  } catch (err) {
    console.error('[createArtistProfile] pre-check failed', err);
  }

  const payload = {
    ...artistData,
    is_approved: false,
  };
  const response = await fetch(`${API_BASE_URL}/api/artists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to create artist profile');
  }

  return response.json();
}

export async function getArtistBySlug(slug: string) {
  const response = await fetch(`${API_BASE_URL}/api/artists/${slug}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Artist not found');
  }

  return response.json();
}

export async function getPendingArtists() {
  const res = await fetch(`${API_BASE_URL}/api/artists/pending`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch pending artists');
  }
  return res.json();
}

export async function approveArtist(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/artists/${id}/approve`, {
    method: 'PUT',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to approve artist');
  }
  return res.json();
}

export async function deleteArtist(slug: string) {
  const res = await fetch(`${API_BASE_URL}/api/artists/${slug}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to delete artist');
  }
}

export async function updateArtist(slug: string, artistData: any) {
  const res = await fetch(`${API_BASE_URL}/api/artists/${slug}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(artistData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update artist');
  }
  return res.json();
}
