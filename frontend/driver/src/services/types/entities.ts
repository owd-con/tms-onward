/**
 * TMS Driver - Session & User Type Definitions
 */

export interface User {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  language: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  company?: any;
}

export interface Session {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: User;
}
