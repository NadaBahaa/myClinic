import { create } from 'zustand';
import type { SystemUser } from '../../app/components/UserDetailModal';
import type { User } from '../../app/App';

interface AuthState {
  user: User | null;
  allUsers: SystemUser[];
  setUser: (user: User | null) => void;
  setAllUsers: (users: SystemUser[]) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  allUsers: [],
  setUser: (user) => set({ user }),
  setAllUsers: (allUsers) => set({ allUsers }),
  clearSession: () => set({ user: null, allUsers: [] }),
}));
