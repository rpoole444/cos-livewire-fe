// interfaces.ts
export interface CustomEvent {
  id: number; // Changed from string to number
  title: string;
  date: string;
  description: string;
  location: string;
  start_time: string; 
  end_time: string;
  venue_name: string;
  address: string;
  website: string;
  genre: string;
  age_restriction: string;
  ticket_price: string;
  customTicketPrice?: string;
  website_link: string;
  poster: string | null;
  eventType: string;
  recurrence?: string,
  repeatCount?: number,
}

// interfaces.ts
export interface Event extends CustomEvent {
  id: number; // Ensure this matches CustomEvent
  title: string;
  description: string;
  location: string;
  date: string;
  start_time: string; 
  end_time: string;
  eventType: string;
  genre: string;
  ticket_price: string;
  customTicketPrice?: string;
  age_restriction: string;
  website_link: string;
  address: string;
  venue_name: string; 
  website: string;
  poster: string | null;
  recurrence?: string,
  repeatCount?: number,
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
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

export type Users = User[];
export type Events = Event[];

export type { User };
