import { api } from '../api-client.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
  session: Record<string, unknown>;
}

export const authApi = {
  getSession: () => api.get<AuthSession | null>('/auth/get-session'),

  signUp: (data: { name: string; email: string; password: string }) =>
    api.post<AuthSession>('/auth/sign-up/email', data),

  signIn: (data: { email: string; password: string }) =>
    api.post<AuthSession>('/auth/sign-in/email', data),

  signOut: () => api.post<void>('/auth/sign-out'),
};
