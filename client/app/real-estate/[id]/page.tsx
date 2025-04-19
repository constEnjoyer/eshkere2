"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Share2, Users, Calendar, MapPin, Bed, Bath, SquareIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";

type Profile = {
  id: string;
  username: string;
  email: string;
  profilePicture?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  skills: string[];
  friendsCount: number;
  postsCount: number;
  eventsCount: number;
};

type Friend = {
  id: string;
  username: string;
  profilePicture?: string | null;
};

type Seller = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar?: string | null;
  skills: string[];
};

type Property = {
  id: number;
  title: string;
  description: string;
  location: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  imageUrls: string[];
  createdAt: string;
  authorId: string;
  seller: Seller;
};

export default function ProfilePage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const userId = typeof params.userId === "string" ? params.userId : undefined;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Property[]>([]);
  const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) {
      console.log("[ProfilePage] Waiting for auth...");
      return;
    }

    if (!user) {
      console.log("[ProfilePage] No user, redirecting to login");
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите, чтобы просмотреть профиль",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        if (!userId) {
          throw new Error("ID пользователя не указан");
        }

        const url = `http://localhost:5000/api/auth/user/${userId}`;
        console.log("[ProfilePage] Fetching profile from:", url);
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Требуется авторизация");
          }
          if (response.status === 404) {
            throw new Error("Пользователь не найден");
          }
          throw new Error(`Не удалось загрузить профиль: ${response.status}`);
        }

        const data: Profile = await response.json();
        console.log("[ProfilePage] Profile fetched:", data);
        setProfile(data);
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.error("[ProfilePage] Error fetching profile:", error);
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось загрузить профиль",
          variant: "destructive",
        });
        router.push("/");
      }
    };

    const fetchPosts = async () => {
      try {
        if (!userId || isNaN(parseInt(userId)) || parseInt(userId) <= 0) {
          throw new Error("Недействительный ID пользователя");
        }

        const url = `http://localhost:5000/api/posts/user/${userId}`;
        console.log("[ProfilePage] Fetching posts from:", url);
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Требуется авторизация");
          }
          throw new Error(`Не удалось загрузить посты: ${response.status}`);
        }

        const data = await response.json();
        console.log("[ProfilePage] Raw posts data:", data);
        const filteredPosts = Array.isArray(data)
          ? data.map((post: any) => ({
              ...post,
              imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls : [],
            }))
          : [];
        console.log("[ProfilePage] Processed posts:", filteredPosts);
        setPosts(filteredPosts);
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.error("[ProfilePage] Error fetching posts:", error);
        setPosts([]);
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось загрузить посты",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    fetchPosts();

    return () => {
      controller.abort();
    };
  }, [userId, user, toast, router, isLoading]);

  const fetchFriends = async () => {
    try {
      const url = `http://localhost:5000/api/friends/${userId}`;
      console.log("[ProfilePage] Fetching friends from:", url);
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить друзей");
      }

      const data: Friend[] = await response.json();
      console.log("[ProfilePage] Friends fetched:", data);
      setFriends(data);
      setFriendsDialogOpen(true);
    } catch (error) {
      console.error("[ProfilePage] Error fetching friends:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось загрузить друзей",
        variant: "destructive",
      });
    }
  };

  const handleShareProfile = () => {
    if (!profile) {
      console.log("[ProfilePage] Cannot share profile: profile is null");
      toast({
        title: "Ошибка",
        description: "Профиль не загружен",
        variant: "destructive",
      });
      return;
    }
    const profileUrl = `http://localhost:3000/profile/${profile.id}`;
    navigator.clipboard.writeText(profileUrl);
    console.log("[ProfilePage] Profile URL copied:", profileUrl);
    toast({ title: "Успех", description: "Ссылка на профиль скопирована" });
    setShareDialogOpen(false);
  };

  if (isLoading) {
    console.log("[ProfilePage] Rendering: isLoading");
    return <div className="container px-4 py-8">Проверка авторизации...</div>;
  }

  if (loading) {
    console.log("[ProfilePage] Rendering: loading");
    return <div className="container px-4 py-8">Загрузка...</div>;
  }

  if (!profile) {
    console.log("[ProfilePage] Rendering: no profile");
    return (
      <div className="container px-4 py-8">
        <h1 className="text-2xl font-bold">Пользователь не найден</h1>
      </div>
    );
  }

  console.log("[ProfilePage] Renderingohm profile for:", profile.username, { postCount: posts.length });

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900"
          >
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage
                  src={profile.profilePicture ? `http://localhost:5000${profile.profilePicture}` : "/placeholder.svg?height=96&width=96"}
                  alt={profile.username}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {profile.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4">
                <h2 className="text-xl font-bold">{profile.username}</h2>
                <p className="text-sm text-muted-foreground">Агент по недвижимости</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  События
                </span>
                <Badge variant="outline" className="bg-primary/5">{profile.eventsCount || 0}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between cursor-pointer" onClick={fetchFriends}>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Подписчики
                </span>
                <Badge variant="outline" className="bg-primary/5">{profile.friendsCount || 0}</Badge>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="outline" className="w-full" onClick={() => setShareDialogOpen(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Поделиться
              </Button>
            </div>
          </motion.div>
        </div>
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 rounded-xl border bg-white shadow-sm dark:bg-gray-900"
          >
            <Tabs defaultValue="about">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger
                  value="about"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                >
                  О себе
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                >
                  Контакты
                </TabsTrigger>
              </TabsList>
              <TabsContent value="about" className="p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-primary">Биография</h2>
                    <div className="mt-4 rounded-lg border p-4 bg-muted/30">
                      <p className="text-muted-foreground">{profile.bio || "Биография не указана"}</p>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-primary">Навыки</h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.skills.length > 0 ? (
                        profile.skills.map((skill, index) => (
                          <Badge key={index} className="bg-primary/10 text-primary hover:bg-primary/20">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">Навыки не указаны</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-primary">Объявления</h2>
                    {Array.isArray(posts) && posts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {posts.map((post) => {
                          console.log("[ProfilePage] Rendering post:", { id: post.id, title: post.title, imageUrls: post.imageUrls });
                          return (
                            <Card key={post.id} className="overflow-hidden">
                              <div className="relative h-32">
                                <Link href={`/real-estate/${post.id}`}>
                                  <Image
                                    src={post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls[0] : "/placeholder.svg"}
                                    alt={post.title || "Property"}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                  />
                                </Link>
                              </div>
                              <div className="p-4">
                                <Link href={`/real-estate/${post.id}`}>
                                  <h3 className="text-sm font-semibold hover:underline">
                                    {post.title || "Без названия"}
                                  </h3>
                                </Link>
                                <p className="text-xs text-gray-600 mb-2">
                                  {post.description?.slice(0, 50)}...
                                </p>
                                <div className="flex items-center gap-2 mb-2">
                                  <MapPin className="h-3 w-3 text-primary" />
                                  <span className="text-xs">{post.location || "Не указано"}</span>
                                </div>
                                <div className="flex gap-3 mb-2">
                                  {post.bedrooms && (
                                    <div className="flex items-center gap-1">
                                      <Bed className="h-3 w-3 text-primary" />
                                      <span className="text-xs">{post.bedrooms}</span>
                                    </div>
                                  )}
                                  {post.bathrooms && (
                                    <div className="flex items-center gap-1">
                                      <Bath className="h-3 w-3 text-primary" />
                                      <span className="text-xs">{post.bathrooms}</span>
                                    </div>
                                  )}
                                  {post.squareMeters && (
                                    <div className="flex items-center gap-1">
                                      <SquareIcon className="h-3 w-3 text-primary" />
                                      <span className="text-xs">{post.squareMeters} м²</span>
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm font-bold text-primary">
                                  €{post.price.toLocaleString()}
                                </span>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-4">Объявления отсутствуют</p>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="info" className="p-6">
                <h2 className="text-xl font-bold">Контактные данные</h2>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h3 className="flex items-center gap-2 font-medium">
                      <Users className="h-5 w-5 text-primary" />
                      Информация
                    </h3>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5">Email</Badge>
                        <span className="text-sm">{profile.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5">Телефон</Badge>
                        <span className="text-sm">{profile.phone || "Не указан"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5">Локация</Badge>
                        <span className="text-sm">{profile.location || "Не указана"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Поделиться профилем</DialogTitle>
            <DialogDescription>
              Скопируйте ссылку ниже, чтобы поделиться этим профилем.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input readOnly value={`http://localhost:3000/profile/${profile?.id || ""}`} />
          </div>
          <DialogFooter>
            <Button onClick={handleShareProfile}>Копировать ссылку</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={friendsDialogOpen} onOpenChange={setFriendsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Подписчики</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {friends.length === 0 ? (
              <p className="text-muted-foreground">Подписчики отсутствуют</p>
            ) : (
              friends.map((friend) => (
                <Link
                  key={friend.id}
                  href={`/profile/${friend.id}`}
                  className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={friend.profilePicture ? `http://localhost:5000${friend.profilePicture}` : "/placeholder.svg?height=40&width=40"}
                      alt={friend.username}
                    />
                    <AvatarFallback>{friend.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{friend.username}</span>
                </Link>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}