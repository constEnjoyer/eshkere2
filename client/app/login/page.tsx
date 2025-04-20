"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("[LoginPage] Form submitted:", { email, password, rememberMe });

    if (!email || !password) {
      console.log("[LoginPage] Validation failed: Empty fields");
      setError("Пожалуйста, заполните все поля");
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните email и пароль",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("[LoginPage] Calling login:", { email, rememberMe });
      const result = await login(email, password, rememberMe);
      console.log("[LoginPage] Login result:", result);

      if (result.success) {
        console.log("[LoginPage] Login successful, redirecting to /profile");
        toast({
          title: "Вход успешен",
          description: "Добро пожаловать в RealEstatePro!",
        });
        router.replace("/profile");
      } else {
        console.error("[LoginPage] Login failed:", result.message);
        setError(result.message);
        toast({
          title: "Ошибка входа",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      console.error("[LoginPage] Unexpected error:", { message: err.message, stack: err.stack });
      setError(err.message);
      toast({
        title: "Ошибка",
        description: err.message.includes("fetch") ? "Не удалось подключиться к серверу. Проверьте, работает ли сервер." : err.message,
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
          <CardTitle>Вход</CardTitle>
          <CardDescription>Войдите в свой аккаунт RealEstatePro</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="rememberMe">Запомнить меня</Label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Войти
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Зарегистрируйтесь
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            Забыли пароль?{" "}
            <Link href="/forgot-password" className="text-primary hover:underline">
              Восстановить
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}