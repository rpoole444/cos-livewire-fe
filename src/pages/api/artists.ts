const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;


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
