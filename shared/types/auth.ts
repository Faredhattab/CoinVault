export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  linked_providers: string[];
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  device_info: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
  is_active: boolean;
}

export interface AuthResponse {
  user: UserProfile;
  session?: Session;
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
  provider?: 'password' | 'google';
}
