export interface UserType {
  id: number;
  first_name: string;
  last_name: string;
  display_name?: string;
  email: string;
  password?: string;
  is_admin: boolean;
  is_logged_in?: boolean;
  top_music_genres: string[]; // array after parsing
  user_description?: string;
  profile_picture?: string;
}
