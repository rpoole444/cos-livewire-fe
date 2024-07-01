interface Event {
  id:number;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  eventType: string;
  genre: string;
  ticket_price: string;
  age_restriction: string;
  website_link: string;
  address: string;
  venue_name: string; 
  website: string;
  poster: string | null;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  is_admin: boolean;
  is_logged_in: boolean;
}
// interfaces.ts
export interface CustomEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  venue_name?: string;
  address: string;
  website?: string;
  age_restriction?: string;
  ticket_price?: number;
  website_link?: string;
  poster?: string;
}


export type Users = User[];
export type Events = Event[];


export type { User, Event } 