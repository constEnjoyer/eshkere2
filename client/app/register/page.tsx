"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const { toast } = useToast();
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("[RegisterPage] Form submitted:", { username, email, password });

    if (!username || !email || !password) {
      console.log("[RegisterPage] Validation failed: Empty fields");
      setError("Пожалуйста, заполните все поля");
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните имя пользователя, email и пароль",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("[RegisterPage] Calling register:", { username, email });
      const result = await register(username, email, password);
      console.log("[RegisterPage] Register result:", result);

      if (result.success) {
        console.log("[RegisterPage] Registration successful, redirecting to /login");
      } else {
        console.error("[RegisterPage] Registration failed:", result.message);
        setError(result.message);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      console.error("[RegisterPage] Unexpected error:", { message: err.message, stack: err.stack });
      setError("Произошла непредвиденная ошибка: " + err.message);
      toast({
        title: "Ошибка",
        description: "Не удалось зарегистрироваться. Проверьте подключение или попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт в RealEstatePro</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                placeholder="Введите имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Зарегистрироваться
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Войдите
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}