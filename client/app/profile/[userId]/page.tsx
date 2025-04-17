"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string | null;
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите, чтобы просмотреть профиль",
        variant: "destructive",
      });
      return;
    }

    const fetchProfile = async () => {
      try {
        console.log(`[ProfilePage] Fetching profile for userId: ${id}`);
        const res = await fetch(`http://localhost:5000/api/users/${id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch profile: ${res.status}`);
        }
        const data = await res.json();
        setProfile(data);
      } catch (error) {
        console.error("[ProfilePage] Error fetching profile:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить профиль",
          variant: "destructive",
        });
      }
    };

    fetchProfile();
  }, [id, user, toast]);

  if (!profile) {
    return <div className="container py-8">Загрузка...</div>;
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src={profile.avatar || "/placeholder.svg?height=64&width=64"} alt={profile.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {profile.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-sm text-muted-foreground">{profile.phone || "Телефон не указан"}</p>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="outline">Связаться</Button>
        </div>
      </div>
    </div>
  );
}