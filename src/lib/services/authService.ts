import { apiFetch, setToken, removeToken } from '../api';
import type { User } from '../../app/App';

interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setToken(data.token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      removeToken();
    }
  },

  async me(): Promise<User> {
    return apiFetch<User>('/auth/me');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiFetch('/auth/password', {
      method: 'PUT',
      body: { current_password: currentPassword, password: newPassword, password_confirmation: newPassword },
    });
  },
};
