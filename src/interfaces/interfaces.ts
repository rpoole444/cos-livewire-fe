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
  venue_profile_id?: number | null;
  address: string;
  website: string;
  genre: string;
  age_restriction: string;
  ticket_price: string;
  customTicketPrice?: string;
  website_link: string;
  poster: string | null;
  region?: string;
  source?: string | null;
  source_label?: string | null;
  source_fingerprint?: string | null;
  source_import_event_id?: number | null;
  artist_profile_id?: number | null;
  claimed_by_user_id?: number | null;
  claimed_at?: string | null;
  last_edited_by_user_id?: number | null;
  claimed_artist?: {
    id: number;
    display_name: string;
    slug: string;
    profile_type?: string;
    user_id: number;
  } | null;
  claimed_by_user_email?: string | null;
  can_edit_event?: boolean;
  can_delete_event?: boolean;
  uses_generic_imported_poster?: boolean;
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
  venue_profile_id?: number | null;
  website: string;
  poster: string | null;
  region?: string;
  claimed_by_user_id?: number | null;
  claimed_at?: string | null;
  last_edited_by_user_id?: number | null;
  claimed_artist?: {
    id: number;
    display_name: string;
    slug: string;
    profile_type?: string;
    user_id: number;
  } | null;
  claimed_by_user_email?: string | null;
  can_edit_event?: boolean;
  can_delete_event?: boolean;
  uses_generic_imported_poster?: boolean;
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
  user_id: number;
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
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  profile_type?: 'artist' | 'venue' | 'promoter';
  home_region?: string;
  venue_address?: string;
  venue_city?: string;
  venue_state?: string;
  venue_postal_code?: string;
  venue_phone?: string;
  booking_email?: string;
  venue_capacity?: number | null;
  age_policy?: string;
  venue_stage_size?: string | null;
  venue_pa_details?: string | null;
  venue_backline?: string | null;
  venue_load_in?: string | null;
  venue_parking?: string | null;
  venue_green_room?: string | null;
  venue_sound_contact?: string | null;
  venue_booking_policy?: string | null;
}


export type Artists = Artist[];

export type { User };
