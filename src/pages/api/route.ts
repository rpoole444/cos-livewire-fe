import { parseMSTDate } from "@/util/dateHelper";
import { Events } from "@/interfaces/interfaces"; // Make sure this import exists

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
  console.log("[API:getEvents] responding with", sortedEvents.length, "event(s). date range:",
    sortedEvents.length
      ? { min: sortedEvents[sortedEvents.length - 1].date, max: sortedEvents[0].date }
      : "none"
  );
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

    const data = await res.json();
    console.log('EVENT DATA:', data);

    return data;
  } catch (err) {
    console.error('Error fetching event details:', err);
    return null;
  }
};


async function registerUser(firstName: string, lastName: string, displayName: string, email: string, password: string, description: string, genres: string[]) {
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
        top_music_genres: genres
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
    console.log("login successful:", data)
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
  console.log("logout successful:", response);
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

async function updateEventStatus(eventId: number, isApproved: boolean): Promise<void> {
  try {
    // Construct the payload
    const payload: EventStatusUpdatePayload = {
      isApproved,
    };

    // Send the PUT request to the backend
    const response = await fetch(`${API_BASE_URL}/api/events/review/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    // Check if the response is ok
    if (!response.ok) {
      // If the response is not ok, throw an error with the response status
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // You can handle the successful response here if needed
    const data = await response.json();
    console.log(data.message); // Logging the success message from the response
  } catch (error) {
    // Handle any errors that occurred during the request
    console.error('There was an error updating the event status', error);
  }
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

async function fetchAllUsers(): Promise<void> {
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
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/slug/${slug}`);
  if (!res.ok) throw new Error("Event not found");
  return res.json();
}


async function deleteEvent(eventId: number): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', 
    });

     if(!res.ok){
    const errorBody = await res.json(); // Try to parse the response body as JSON
      throw new Error(errorBody.message || 'Failed to fetch data');
  }
 if (res.status !== 204) {
    const data = await res.json();
    console.log(data);
  }
  } catch (error) {
    // Handle any errors that occurred during the request
    console.error('There was an error deleting the event', error);
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
  updateEventStatus,
  updateEventDetails,
  fetchEventDetails,
  deleteEvent
};
