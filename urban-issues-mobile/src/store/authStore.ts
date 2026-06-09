// Global auth state managed by Zustand, persisted in AsyncStorage
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '../types/api';

const AUTH_KEY = '@auth:user';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  loadFromStorage: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: async (user) => {
    set({ user });
    if (user) {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(AUTH_KEY);
    }
  },

  loadFromStorage: async () => {
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    set({ user: raw ? JSON.parse(raw) : null, isLoading: false });
  },

  logout: async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    set({ user: null });
  },
}));
