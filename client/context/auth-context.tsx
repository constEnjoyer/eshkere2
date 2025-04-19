"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export type User = {
  skills: never[];
  id: string;
  username: string;
  email: string;
  roles: string[];
  isActive: boolean;
  profilePicture?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  age?: number | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  register: (userData: { username: string; email: string; password: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const checkAuth = async () => {
    try {
      console.log("[AuthProvider] Checking auth status...", {
        cookies: document.cookie,
        url: "http://localhost:5000/api/auth/user",
        pathname: window.location.pathname,
      });

      const response = await fetch("http://localhost:5000/api/auth/user", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        cache: "no-store",
      });

      console.log("[AuthProvider] Response status:", response.status, {
        headers: [...response.headers.entries()],
      });

      if (!response.ok) {
        let errorData: { message?: string } = {};
        try {
          errorData = await response.json();
        } catch (jsonError: unknown) {
          console.error("[AuthProvider] Failed to parse error response:", jsonError);
        }
        console.error("[AuthProvider] Fetch user failed:", {
          status: response.status,
          message: errorData.message || "No error message",
          cookies: document.cookie,
          responseHeaders: [...response.headers.entries()],
        });

        if (response.status === 401 || response.status === 403) {
          setUser(null);
          if (window.location.pathname !== "/login") {
            toast({
              title: "Ошибка авторизации",
              description: "Ваша сессия истекла. Пожалуйста, войдите снова.",
              variant: "destructive",
            });
            router.push("/login");
          }
          return;
        }

        throw new Error(errorData.message || `Failed to fetch user: ${response.status}`);
      }

      const userData = await response.json();
      console.log("[AuthProvider] User fetched:", userData);

      if (!userData.id || !userData.username || !userData.email) {
        throw new Error("Invalid user data received from server");
      }

      setUser({
        skills: Array.isArray(userData.skills) ? userData.skills : [],
        id: userData.id,
        username: userData.username,
        email: userData.email,
        roles: Array.isArray(userData.roles) ? userData.roles : [],
        isActive: !!userData.isActive,
        profilePicture: userData.profilePicture || null,
        bio: userData.bio || null,
        phone: userData.phone || null,
        location: userData.location || null,
        age: typeof userData.age === "number" ? userData.age : null,
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      console.error("[AuthProvider] Error checking auth:", {
        message: err.message,
        stack: err.stack,
        cookies: document.cookie,
        pathname: window.location.pathname,
      });

      let errorMessage = "Не удалось проверить авторизацию.";
      if (err.message.includes("Failed to fetch")) {
        errorMessage = "Не удалось подключиться к серверу. Проверьте, запущен ли сервер на localhost:5000.";
      } else if (err.message.includes("Invalid user data")) {
        errorMessage = "Получены некорректные данные пользователя от сервера.";
      }

      setUser(null);
      if (window.location.pathname !== "/login") {
        toast({
          title: "Ошибка",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("[AuthProvider] Mounting, triggering checkAuth");
    checkAuth();
  }, [router]);

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      console.log("[AuthProvider] Logging in:", email, { rememberMe });
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      console.log("[AuthProvider] Login response status:", response.status);
      const data = await response.json();
      if (!response.ok) {
        console.error("[AuthProvider] Login failed:", response.status, data.message || "No error message");
        return { success: false, message: data.message || "Failed to login" };
      }

      const userResponse = await fetch("http://localhost:5000/api/auth/user", {
        credentials: "include",
      });
      console.log("[AuthProvider] User fetch response status:", userResponse.status);
      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({}));
        console.error("[AuthProvider] User fetch failed:", userResponse.status, errorData.message || "No error message");
        throw new Error(errorData.message || "Failed to fetch user profile");
      }

      const userData = await userResponse.json();
      console.log("[AuthProvider] Login successful:", userData);

      if (!userData.id || !userData.username || !userData.email) {
        throw new Error("Invalid user data received from server");
      }

      setUser({
        skills: Array.isArray(userData.skills) ? userData.skills : [],
        id: userData.id,
        username: userData.username,
        email: userData.email,
        roles: Array.isArray(userData.roles) ? userData.roles : [],
        isActive: !!userData.isActive,
        profilePicture: userData.profilePicture || null,
        bio: userData.bio || null,
        phone: userData.phone || null,
        location: userData.location || null,
        age: typeof userData.age === "number" ? userData.age : null,
      });

      toast({
        title: "Успех",
        description: "Вы успешно вошли в систему",
      });
      router.push("/");
      return { success: true, message: data.message || "Login successful" };
    } catch (error: unknown) {
      const err = error as Error;
      console.error("[AuthProvider] Login error:", err.message);
      toast({
        title: "Ошибка входа",
        description: err.message || "Не удалось войти. Проверьте email и пароль.",
        variant: "destructive",
      });
      return { success: false, message: err.message || "An error occurred during login" };
    }
  };

  const register = async (userData: { username: string; email: string; password: string }) => {
    try {
      console.log("[AuthProvider] Registering:", userData.email);
      const response = await fetch("http://localhost:5000/api/auth/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      console.log("[AuthProvider] Registration response status:", response.status);
      const data = await response.json();
      if (!response.ok) {
        console.error("[AuthProvider] Registration failed:", response.status, data.message || "No error message");
        return { success: false, message: data.message || "Failed to register" };
      }

      toast({
        title: "Успех",
        description: "Регистрация прошла успешно. Пожалуйста, войдите.",
      });
      router.push("/login");
      return { success: true, message: data.message || "Registration successful" };
    } catch (error: unknown) {
      const err = error as Error;
      console.error("[AuthProvider] Registration error:", err.message);
      toast({
        title: "Ошибка регистрации",
        description: err.message || "Не удалось зарегистрироваться.",
        variant: "destructive",
      });
      return { success: false, message: err.message || "An error occurred during registration" };
    }
  };

  const logout = async () => {
    try {
      console.log("[AuthProvider] Logging out...");
      const response = await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      console.log("[AuthProvider] Logout response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[AuthProvider] Logout failed:", response.status, errorData.message || "No error message");
        throw new Error(errorData.message || "Failed to logout");
      }

      setUser(null);
      toast({
        title: "Успех",
        description: "Вы вышли из системы",
      });
      router.push("/login");
    } catch (error: unknown) {
      const err = error as Error;
      console.error("[AuthProvider] Logout error:", err.message);
      toast({
        title: "Ошибка",
        description: "Не удалось выйти из системы",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}