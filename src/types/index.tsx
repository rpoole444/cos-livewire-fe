export interface UserType {
  id: number;
  first_name: string;
  last_name: string;
  displayName?: string;
  display_name?: string;
  email: string;
  password?: string;
  is_admin: boolean;
  is_logged_in?: boolean;
  is_pro?: boolean;
  pro_active: boolean;
  pro_cancelled_at: string | null;
  trial_ends_at?: string | null;
  trial_active?: boolean | null;
  top_music_genres: string[];
  user_description?: string;
  profile_picture?: string;
}
