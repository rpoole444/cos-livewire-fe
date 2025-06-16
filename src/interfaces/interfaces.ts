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
  is_approved: boolean
  user_id: number; 
  slug:string;
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
  is_approved: boolean,
  slug:string,
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  user_id: number; 
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  is_admin: boolean;
  is_logged_in: boolean;
  is_pro?: boolean;
}

export type Users = User[];
export type Events = Event[];

export interface Artist {
  id: number;
  user_id: number | null;
  display_name: string;
  bio: string;
  contact_email: string;
  profile_image: string;
  genres: string[];
  slug: string;
  website: string;
  embed_youtube?: string;
  embed_soundcloud?: string;
  embed_bandcamp?: string;
  promo_photo?: string;
  stage_plot?: string;
  press_kit?: string;
  tip_jar_url?: string;
  notes?: string;
  is_pro?: boolean;
  is_approved?: boolean;
  trial_active?: boolean;
  trial_start_date?: string;
  /**
   * Indicates if the associated user account still exists. Some APIs may omit
   * this property, so undefined should be treated as true (user exists).
   */
  user_exists?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}


export type Artists = Artist[];

export type { User };
