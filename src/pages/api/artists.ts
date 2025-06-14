const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';


export async function createArtistProfile(artistData: any) {
  const response = await fetch(`${API_BASE_URL}/api/artists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(artistData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create artist profile');
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
  const res = await fetch(`${API_BASE_URL}/api/artists/review`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch pending artists');
  }
  return res.json();
}

export async function approveArtist(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/artists/review/${id}`, {
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
