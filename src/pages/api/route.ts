interface EventStatusUpdatePayload {
  isApproved: boolean;
}
async function getEvents() {
  const res = await fetch('http://localhost:3000/api/events')
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  const data = await res.json();
  console.log("EVENTS DATA: ", data)
  const sortedEvents = data.sort((a :any, b :any) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
  return sortedEvents
}
async function registerUser(firstName: string, lastName: string, email: string, password: string) {
  try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
       body: JSON.stringify({
        first_name: firstName, 
        last_name: lastName,
        email: email,
        password: password,
      }),
        credentials: 'include',
      });
         const data = await res.json(); 
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to register');
      }
      return data;
  } catch (error) {
    throw (error instanceof Error) ? error : new Error(String(error));
  }
}

async function loginUser(email: string, password: string){
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
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

async function submitEvent(eventData:any){
  const response = await fetch('http://localhost:3000/api/events/submit', { 
    method: 'POST', 
    body: JSON.stringify(eventData), 
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' } });
    
     return response

}

async function logoutUser(): Promise<void> {
  try {
    await fetch('/logout', {method: 'POST'});
  } catch (err) {
    console.error(err);
  }
}

async function getEventsForReview(): Promise<void> {
  const res = await fetch('http://localhost:3000/api/events/review')
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
    const response = await fetch(`http://localhost:3000/api/events/review/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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

async function fetchAllUsers(): Promise<void> {
  const res = await fetch('http://localhost:3000/api/auth/users')
  if(!res.ok){
    throw new Error('Failed to fetch data')
  }
  const data = await res.json();
  return data
}
export { 
  fetchAllUsers,
  submitEvent, 
  getEvents, 
  registerUser,
  loginUser, 
  logoutUser, 
  getEventsForReview,
   updateEventStatus };