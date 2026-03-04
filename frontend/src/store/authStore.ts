import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: number;
  email: string;
  display_name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string, refresh: string, user: User) => void;
  setAccessToken: (access: string) => void;
  setRefreshToken: (refresh: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setTokens: (access, refresh, user) =>
        set({ accessToken: access, refreshToken: refresh, user }),
      setAccessToken: (access) => set({ accessToken: access }),
      setRefreshToken: (refresh) => set({ refreshToken: refresh }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "talkrift-auth",
      // Only persist refresh token + user; access token is in memory
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
