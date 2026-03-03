"use client";

import { useRouter } from "next/navigation";
import apiClient from "@/api/client";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, setTokens, clearAuth } = useAuthStore();

  const isAuthenticated = !!accessToken;

  async function login(email: string, password: string) {
    const { data } = await apiClient.post("/auth/login/", { email, password });
    setTokens(data.access, data.refresh, data.user);
    // Persist refresh token in cookie for middleware access
    document.cookie = `refreshToken=${data.refresh}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    document.cookie = `isAuthenticated=1; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    router.push("/");
  }

  async function register(
    display_name: string,
    email: string,
    password: string
  ) {
    const { data } = await apiClient.post("/auth/register/", {
      display_name,
      email,
      password,
    });
    setTokens(data.access, data.refresh, data.user);
    document.cookie = `isAuthenticated=1; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    router.push("/");
  }

  async function loginWithGoogle(googleToken: string) {
    const { data } = await apiClient.post("/auth/google/", {
      token: googleToken,
    });
    setTokens(data.access, data.refresh, data.user);
    document.cookie = `isAuthenticated=1; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    router.push("/");
  }

  async function logout() {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await apiClient.post("/auth/logout/", { refresh: refreshToken });
      }
    } catch {
      // Best-effort logout
    } finally {
      clearAuth();
      document.cookie =
        "isAuthenticated=; path=/; max-age=0; SameSite=Lax";
      router.push("/login");
    }
  }

  return { user, isAuthenticated, login, register, loginWithGoogle, logout };
}
