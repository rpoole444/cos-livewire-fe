import { parseMSTDate } from "@/util/dateHelper";
import { Events, Users } from "@/interfaces/interfaces";

interface EventStatusUpdatePayload {
  isApproved: boolean;
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function getEvents() {
const res = await fetch(`${API_BASE_URL}/api/events`, {
    credentials: 'include', // Include credentials
  });
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  const data = await res.json();

  const sortedEvents = data.sort((a :any, b :any) => {
    return parseMSTDate(b.date).getTime() - parseMSTDate(a.date).getTime()
  })
  return sortedEvents
}

const fetchEventDetails = async (eventId: number) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      credentials: 'include',
    });

    if (!res.ok) {
      console.error('Fetch failed with status:', res.status);
      return null;
    }

    return res.json();
  } catch (err) {
    console.error('Error fetching event details:', err);
    return null;
  }
};


async function registerUser(firstName: string, lastName: string, displayName: string, email: string, password: string, description: string, genres: string[], inviteCode?: string) {
  try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
       body: JSON.stringify({
        first_name: firstName, 
        last_name: lastName,
        displayName,
        email,
        password,
        user_description: description,
        top_music_genres: genres,
        inviteCode,
      }),
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to register');
      }
      const data = await res.json(); 
      return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

async function loginUser(email: string, password: string){
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
       credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to login");
    }
    return data; // Return the successful response data
  } catch (error) {
    // Convert error to a string if necessary and re-throw it to be handled by the caller
    throw (error instanceof Error) ? error : new Error(String(error));
  }
    
}

async function submitEvent(formData:any){
  const response = await fetch(`${API_BASE_URL}/api/events/submit`, { 
    method: 'POST', 
    body: formData, 
    credentials: 'include',
    // headers: { 'Content-Type': 'application/json' } 
  });
    
     return response

}

async function logoutUser(): Promise<void> {
  try{
 const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    // If the HTTP status code does not indicate success,
    // throw an error to be caught by the calling function.
    throw new Error('Logout failed');
  }
} catch (error) {
    console.error('Logout failed with error:', error);
    throw error; // Re-throw the error to be caught by the calling function
  }
}

async function getEventsForReview(): Promise<Events> {
  const res = await fetch(`${API_BASE_URL}/api/events/review`, {
    credentials: 'include', // Include credentials
  });
  if(!res.ok){
    throw new Error('Failed to fetch data')
  }
  const data = await res.json();
  return data
}

async function getAdminSummary() {
  const res = await fetch(`${API_BASE_URL}/api/events/admin/summary`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || 'Failed to fetch admin summary');
  }
  return res.json();
}

async function updateEventStatus(eventId: number, isApproved: boolean): Promise<void> {
  const payload: EventStatusUpdatePayload = {
    isApproved,
  };

  const response = await fetch(`${API_BASE_URL}/api/events/review/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || `Failed to update event status (status ${response.status})`);
  }

  await response.json().catch(() => null);
}

async function bulkUpdateEventStatus(eventIds: number[], isApproved: boolean): Promise<{ updatedIds: number[]; skippedIds: number[]; updatedCount: number }> {
  const response = await fetch(`${API_BASE_URL}/api/events/review/bulk`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ eventIds, isApproved }),
    credentials: 'include',
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Failed to bulk update event status (status ${response.status})`);
  }

  return {
    updatedIds: Array.isArray(data?.updatedIds) ? data.updatedIds.map(Number).filter(Number.isInteger) : [],
    skippedIds: Array.isArray(data?.skippedIds) ? data.skippedIds.map(Number).filter(Number.isInteger) : [],
    updatedCount: Number(data?.updatedCount || 0),
  };
}

async function getEventClaimRequests() {
  const res = await fetch(`${API_BASE_URL}/api/events/claims/review`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || 'Failed to fetch event claim requests');
  }
  return res.json();
}

async function getMyEventClaims() {
  const res = await fetch(`${API_BASE_URL}/api/events/claims/mine`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || 'Failed to fetch your event claims');
  }
  return res.json();
}

async function reviewEventClaim(claimId: number, approve: boolean, adminNotes?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/events/claims/${claimId}/review`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ approve, admin_notes: adminNotes || null }),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || `Failed to review claim request (status ${response.status})`);
  }

  await response.json().catch(() => null);
}

const updateEventDetails = async (eventId: number, eventData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update event');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating event details:', error);
    throw error;
  }
};

async function fetchAllUsers(): Promise<Users> {
  const res = await fetch(`${API_BASE_URL}/api/auth/users`, {
      credentials: 'include', // Make sure to include credentials if this endpoint requires authentication
    });
  if(!res.ok){
    const errorBody = await res.json(); // Try to parse the response body as JSON
      throw new Error(errorBody.message || 'Failed to fetch data');
  }
  const data = await res.json();
 
  return data
}

export async function fetchEventDetailsBySlug(slug: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/slug/${slug}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error("Event not found");
  return res.json();
}


async function deleteEvent(eventId: number, options?: { adminNotes?: string; notifySubmitter?: boolean }): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      admin_notes: options?.adminNotes || null,
      notify_submitter: options?.notifySubmitter === true,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || `Failed to delete event (status ${res.status})`);
  }

  if (res.status !== 204) {
    await res.json().catch(() => null);
  }
}
export { 
  fetchAllUsers,
  submitEvent, 
  getEvents, 
  registerUser,
  loginUser, 
  logoutUser, 
  getEventsForReview,
  getAdminSummary,
  updateEventStatus,
  bulkUpdateEventStatus,
  getEventClaimRequests,
  getMyEventClaims,
  reviewEventClaim,
  updateEventDetails,
  fetchEventDetails,
  deleteEvent
};
