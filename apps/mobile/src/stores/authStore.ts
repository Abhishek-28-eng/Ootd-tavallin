// ============================================================
// Auth Store — Zustand with SecureStore persistence
// ============================================================

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS, apiClient } from '../lib/apiClient';
import type { AuthUser } from '@tavallin/shared';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  clearAuth: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        void apiClient.post('/auth/logout', { refreshToken }, { timeout: 3000 }).catch(() => {});
      }
    } catch {
      // Ignore network errors on logout
    }

    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN).catch(() => {}),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN).catch(() => {}),
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER).catch(() => {}),
    ]);
    delete apiClient.defaults.headers.common['Authorization'];
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    try {
      const [accessToken, refreshToken, userStr] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.USER),
      ]);

      if (accessToken && refreshToken && userStr) {
        const user = JSON.parse(userStr) as AuthUser;
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  updateUser: (updates) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...updates };
      set({ user: updated });
      void SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(updated));
    }
  },
}));
