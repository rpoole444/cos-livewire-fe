
async function getEvents() {
  const res = await fetch('http://localhost:3000/api/events')
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  const data = await res.json();
  console.log("EVENTS DATA: ", data)
  return data
}

async function submitEvent(eventData:any){
  const response = await fetch('http://localhost:3000/api/events/submit', { 
    method: 'POST', 
    body: JSON.stringify(eventData), 
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' } });
    
     return response

}
export { submitEvent,getEvents };