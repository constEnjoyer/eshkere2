"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; message: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const checkAuth = useCallback(async () => {
    console.log("[AuthProvider] Checking auth status...", { pathname, cookies: document.cookie, justLoggedIn });
    setIsLoading(true);
    try {
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());
      const jwtCookie = cookies.find(cookie => cookie.startsWith('jwt='));
      console.log("[AuthProvider] JWT cookie check:", { jwtCookie, cookies });

      if (!jwtCookie) {
        console.log("[AuthProvider] No JWT token found in cookies");
        setIsAuthenticated(false);
        setUser(null);
        if (!["/login", "/register", "/forgot-password"].includes(pathname) && !justLoggedIn) {
          console.log("[AuthProvider] Redirecting to /login");
          router.replace("/login");
        }
        return;
      }

      const response = await fetch("http://localhost:5000/api/auth/user", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      console.log("[AuthProvider] CheckAuth response:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log("[AuthProvider] User data:", data);

      setUser(data);
      setIsAuthenticated(true);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      console.error("[AuthProvider] CheckAuth error:", {
        message: err.message,
        stack: err.stack,
        cookies: document.cookie,
        pathname,
      });
      setIsAuthenticated(false);
      setUser(null);
      if (!["/login", "/register", "/forgot-password"].includes(pathname) && !justLoggedIn) {
        console.log("[AuthProvider] Redirecting to /login due to error");
        router.replace("/login");
      }
    } finally {
      setIsLoading(false);
      setJustLoggedIn(false);
      console.log("[AuthProvider] CheckAuth completed:", { isAuthenticated, user });
    }
  }, [pathname, router, justLoggedIn]);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    console.log("[AuthProvider] Logging in:", { email, rememberMe });
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      console.log("[AuthProvider] Login response:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        setCookie: response.headers.get('set-cookie'),
        cookies: document.cookie,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed: HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[AuthProvider] Login successful:", data);

      toast({ title: "Успех", description: "Вы успешно вошли в систему" });
      setJustLoggedIn(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await checkAuth();
      return { success: true, message: "Login successful" };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      console.error("[AuthProvider] Login error:", {
        message: err.message,
        stack: err.stack,
        cookies: document.cookie,
      });
      toast({
        title: "Ошибка",
        description: err.message.includes("fetch") ? "Не удалось подключиться к серверу. Проверьте, работает ли сервер." : err.message,
        variant: "destructive",
      });
      return { success: false, message: err.message };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    console.log("[AuthProvider] Registering:", { username, email });
    try {
      const response = await fetch("http://localhost:5000/api/auth/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
      });

      console.log("[AuthProvider] Register response:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Registration failed: HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[AuthProvider] Register successful:", data);

      toast({ title: "Успех", description: data.message });
      router.replace("/login");
      return { success: true, message: data.message };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      console.error("[AuthProvider] Register error:", {
        message: err.message,
        stack: err.stack,
        cookies: document.cookie,
      });
      toast({
        title: "Ошибка",
        description: err.message.includes("fetch") ? "Не удалось подключиться к серверу. Проверьте, работает ли сервер." : err.message,
        variant: "destructive",
      });
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    console.log("[AuthProvider] Logging out");
    try {
      const response = await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      console.log("[AuthProvider] Logout response:", {
        status: response.status,
        ok: response.ok,
        cookies: document.cookie,
      });

      if (!response.ok) {
        throw new Error(`Logout failed: HTTP ${response.status}`);
      }

      setUser(null);
      setIsAuthenticated(false);
      toast({ title: "Успех", description: "Вы вышли из системы" });
      router.replace("/login");
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      console.error("[AuthProvider] Logout error:", {
        message: err.message,
        stack: err.stack,
        cookies: document.cookie,
      });
      toast({
        title: "Ошибка",
        description: err.message.includes("fetch") ? "Не удалось подключиться к серверу." : err.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log("[AuthProvider] Mounting, triggering checkAuth", { cookies: document.cookie });
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};