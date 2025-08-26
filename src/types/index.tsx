export interface UserType {
  id: number;
  first_name: string;
  last_name: string;
  displayName?: string;
  email: string;
  password?: string;
  is_admin: boolean;
  is_logged_in?: boolean;
  is_pro?: boolean;
  // Add `pro_cancelled_at` to track when Pro access expires after cancellation.
  pro_cancelled_at?: string | null;
  trial_ends_at?: string | null;
  trial_active?: boolean | null;
  top_music_genres: string[];
  user_description?: string;
  profile_picture?: string;
}
