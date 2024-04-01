interface Event {
  id:number;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  eventType: string;
  genre: string;
  ticketPrice: string;
  ageRestriction: string;
  eventLink: string;
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


export type { User, Event } 