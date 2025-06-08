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
  trial_ends_at?: string | null;
  top_music_genres: string[];
  user_description?: string;
  profile_picture?: string;
}
