"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Share2, Users, Calendar, MapPin, Bed, Bath, SquareIcon, Edit, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";

interface Profile {
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
}

interface Friend {
  id: string;
  username: string;
  profilePicture?: string | null;
}

interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar?: string | null;
  skills: string[];
}

interface Property {
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
}

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Property[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    bio: "",
    phone: "",
    location: "",
    newSkill: "",
    skills: [] as string[],
    profilePicture: null as File | null,
    previewUrl: "" as string,
  });
  const [errors, setErrors] = useState({
    username: "",
    phone: "",
    location: "",
    profilePicture: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[ProfilePage] useEffect triggered, isLoading:", isLoading, "user:", !!user);
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
        setLoading(true);
        const url = "http://localhost:5000/api/auth/user";
        console.log("[ProfilePage] Fetching profile from:", url);
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        console.log("[ProfilePage] Profile response:", {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[ProfilePage] Profile fetch failed:", response.status, errorText);
          if (response.status === 401 || response.status === 403) {
            toast({
              title: "Ошибка авторизации",
              description: "Сессия истекла, войдите снова",
              variant: "destructive",
            });
            router.push("/login");
            return;
          }
          throw new Error(`Не удалось загрузить профиль: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log("[ProfilePage] Raw profile data:", data);
        const normalizedProfile: Profile = {
          id: String(data.id),
          username: data.username || "",
          email: data.email || "",
          profilePicture: data.profilePicture || null,
          bio: data.bio || null,
          phone: data.phone || null,
          location: data.location || null,
          skills: Array.isArray(data.skills) ? data.skills : [],
          friendsCount: Number(data.friendsCount) || 0,
          postsCount: Number(data.postsCount) || 0,
          eventsCount: Number(data.eventsCount) || 0,
        };
        console.log("[ProfilePage] Normalized profile:", normalizedProfile);
        setProfile(normalizedProfile);
        setProfileForm({
          username: normalizedProfile.username,
          bio: normalizedProfile.bio || "",
          phone: normalizedProfile.phone || "",
          location: normalizedProfile.location || "",
          newSkill: "",
          skills: normalizedProfile.skills,
          profilePicture: null,
          previewUrl: normalizedProfile.profilePicture ? `http://localhost:5000${normalizedProfile.profilePicture}` : "",
        });
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.error("[ProfilePage] Error fetching profile:", error.message);
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось загрузить профиль",
          variant: "destructive",
        });
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const url = "http://localhost:5000/api/posts/my";
        console.log("[ProfilePage] Fetching posts from:", url);
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        console.log("[ProfilePage] Posts response:", {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[ProfilePage] Posts fetch failed:", response.status, errorText);
          if (response.status === 401 || response.status === 403) {
            toast({
              title: "Ошибка авторизации",
              description: "Сессия истекла, войдите снова",
              variant: "destructive",
            });
            router.push("/login");
            return;
          }
          throw new Error(`Не удалось загрузить посты: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log("[ProfilePage] Raw posts data:", data);
        const normalizedPosts: Property[] = Array.isArray(data)
          ? data.map((post: any) => ({
              id: Number(post.id),
              title: post.title || "",
              description: post.description || "",
              location: post.location || "",
              price: Number(post.price) || 0,
              bedrooms: post.bedrooms ? Number(post.bedrooms) : undefined,
              bathrooms: post.bathrooms ? Number(post.bathrooms) : undefined,
              squareMeters: post.squareMeters ? Number(post.squareMeters) : undefined,
              imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls : [],
              createdAt: post.createdAt || new Date().toISOString(),
              authorId: String(post.authorId),
              seller: {
                id: String(post.seller?.id || post.authorId),
                name: post.seller?.name || "",
                email: post.seller?.email || "",
                phone: post.seller?.phone || null,
                avatar: post.seller?.avatar || null,
                skills: Array.isArray(post.seller?.skills) ? post.seller.skills : [],
              },
            }))
          : [];
        console.log("[ProfilePage] Normalized posts:", normalizedPosts);
        setPosts(normalizedPosts);
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.error("[ProfilePage] Error fetching posts:", error.message);
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

    return () => controller.abort();
  }, [user, isLoading, toast, router]);

  const fetchFriends = async () => {
    const controller = new AbortController();
    try {
      setLoading(true);
      const url = "http://localhost:5000/api/friends";
      console.log("[ProfilePage] Fetching friends from:", url);
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        signal: controller.signal,
      });

      console.log("[ProfilePage] Friends response:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ProfilePage] Friends fetch failed:", response.status, errorText);
        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Ошибка авторизации",
            description: "Сессия истекла, войдите снова",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }
        throw new Error(`Не удалось загрузить друзей: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("[ProfilePage] Raw friends data:", data);
      const normalizedFriends: Friend[] = Array.isArray(data)
        ? data
            .filter((friend: any) => friend && friend.id)
            .map((friend: any) => ({
              id: String(friend.id),
              username: friend.username || "Unknown",
              profilePicture: friend.profilePicture ? `http://localhost:5000${friend.profilePicture}` : null,
            }))
        : [];
      console.log("[ProfilePage] Normalized friends:", normalizedFriends);
      setFriends(normalizedFriends);
      setFriendsDialogOpen(true);
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("[ProfilePage] Error fetching friends:", error.message);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось загрузить друзей",
        variant: "destructive",
      });
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShareProfile = () => {
    if (!profile) {
      console.log("[ProfilePage] Cannot share profile: profile is null");
      toast({ title: "Ошибка", description: "Профиль не загружен", variant: "destructive" });
      return;
    }
    const profileUrl = `http://localhost:3000/profile/${profile.id}`;
    navigator.clipboard.writeText(profileUrl);
    console.log("[ProfilePage] Profile URL copied:", profileUrl);
    toast({ title: "Успех", description: "Ссылка на профиль скопирована" });
    setShareDialogOpen(false);
  };

  const validateForm = () => {
    const newErrors = { username: "", phone: "", location: "", profilePicture: "" };
    let isValid = true;

    if (!profileForm.username.trim()) {
      newErrors.username = "Имя пользователя обязательно";
      isValid = false;
    }

    if (profileForm.phone && !/^\+?\d{10,15}$/.test(profileForm.phone)) {
      newErrors.phone = "Неверный формат номера телефона";
      isValid = false;
    }

    if (profileForm.location && profileForm.location.length < 2) {
      newErrors.location = "Локация должна содержать минимум 2 символа";
      isValid = false;
    }

    if (profileForm.profilePicture) {
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(profileForm.profilePicture.type)) {
        newErrors.profilePicture = "Поддерживаются только JPEG и PNG";
        isValid = false;
      }
      if (profileForm.profilePicture.size > 5 * 1024 * 1024) {
        newErrors.profilePicture = "Размер файла не должен превышать 5 МБ";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddSkill = () => {
    const skill = profileForm.newSkill.trim();
    if (skill && !profileForm.skills.includes(skill)) {
      setProfileForm({
        ...profileForm,
        skills: [...profileForm.skills, skill],
        newSkill: "",
      });
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfileForm({
      ...profileForm,
      skills: profileForm.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProfileForm({
        ...profileForm,
        profilePicture: file,
        previewUrl,
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !validateForm()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, исправьте ошибки в форме",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("[ProfilePage] Saving profile:", {
        ...profileForm,
        profilePicture: profileForm.profilePicture?.name,
      });
      const formData = new FormData();
      formData.append("username", profileForm.username);
      formData.append("bio", profileForm.bio || "");
      formData.append("phone", profileForm.phone || "");
      formData.append("location", profileForm.location || "");
      formData.append("skills", JSON.stringify(profileForm.skills));
      if (profileForm.profilePicture) {
        formData.append("profilePicture", profileForm.profilePicture);
      }

      const response = await fetch("http://localhost:5000/api/auth/user", {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      console.log("[ProfilePage] Profile save response:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[ProfilePage] Profile save failed:", response.status, errorData);
        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Ошибка авторизации",
            description: "Сессия истекла, войдите снова",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }
        throw new Error(`Не удалось обновить профиль: ${response.status} ${errorData.message || "Unknown error"}`);
      }

      const updatedProfile = await response.json();
      console.log("[ProfilePage] Profile updated:", updatedProfile);
      setProfile({
        ...profile,
        username: updatedProfile.username,
        bio: updatedProfile.bio || null,
        phone: updatedProfile.phone || null,
        location: updatedProfile.location || null,
        skills: Array.isArray(updatedProfile.skills) ? updatedProfile.skills : [],
        profilePicture: updatedProfile.profilePicture || null,
      });
      setProfileForm((prev) => ({
        ...prev,
        profilePicture: null,
        previewUrl: updatedProfile.profilePicture ? `http://localhost:5000${updatedProfile.profilePicture}` : "",
      }));
      URL.revokeObjectURL(profileForm.previewUrl);
      setEditProfileOpen(false);
      toast({ title: "Успех", description: "Профиль обновлен" });
    } catch (error: any) {
      console.error("[ProfilePage] Error saving profile:", error.message);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить профиль",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      console.log("[ProfilePage] Deleting post:", postToDelete);
      const response = await fetch(`http://localhost:5000/api/posts/${postToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });

      console.log("[ProfilePage] Post delete response:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ProfilePage] Post delete failed:", response.status, errorText);
        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Ошибка авторизации",
            description: "Сессия истекла, войдите снова",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }
        throw new Error(`Не удалось удалить пост: ${response.status} ${errorText}`);
      }

      setPosts((prev) => prev.filter((p) => p.id !== postToDelete));
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      toast({ title: "Успех", description: "Пост удален" });
    } catch (error: any) {
      console.error("[ProfilePage] Error deleting post:", error.message);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить пост",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    console.log("[ProfilePage] Rendering: isLoading");
    return <div className="container px-4 py-8">Проверка авторизации...</div>;
  }

  if (!user) {
    console.log("[ProfilePage] Rendering: no user");
    return <div className="container px-4 py-8">Необходимо войти в систему</div>;
  }

  if (loading) {
    console.log("[ProfilePage] Rendering: loading");
    return <div className="container px-4 py-8">Загрузка...</div>;
  }

  if (!profile) {
    console.log("[ProfilePage] Rendering: no profile");
    return (
      <div className="container px-4 py-8">
        <h1 className="text-2xl font-bold">Профиль не найден</h1>
      </div>
    );
  }

  console.log("[ProfilePage] Rendering profile for:", profile.username, { postCount: posts.length, friendsCount: profile.friendsCount });

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
            <div className="relative flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage
                    src={profileForm.previewUrl || profile.profilePicture ? `http://localhost:5000${profile.profilePicture}` : "/placeholder.svg?height=96&width=96"}
                    alt={profile.username}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {profile.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditProfileOpen(true)}
                  className="absolute bottom-0 right-0 bg-white rounded-full shadow-md hover:bg-primary/10"
                >
                  <Edit className="h-5 w-5 text-primary" />
                </Button>
              </div>
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
                <Badge variant="outline" className="bg-primary/5">{profile.eventsCount}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between cursor-pointer" onClick={fetchFriends}>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Подписчики
                </span>
                <Badge variant="outline" className="bg-primary/5">{profile.friendsCount}</Badge>
              </div>
            </div>
            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShareDialogOpen(true)}
              >
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
                          <Badge
                            key={index}
                            className="bg-primary/10 text-primary hover:bg-primary/20"
                          >
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
                    {posts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {posts.map((post) => (
                          <Card key={post.id} className="overflow-hidden">
                            <div className="relative h-32">
                              <Link href={`/real-estate/${post.id}`}>
                                <Image
                                  src={post.imageUrls[0] || "/placeholder.svg"}
                                  alt={post.title}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                />
                              </Link>
                            </div>
                            <div className="p-4">
                              <div className="flex justify-between items-start">
                                <Link href={`/real-estate/${post.id}`}>
                                  <h3 className="text-sm font-semibold hover:underline">
                                    {post.title}
                                  </h3>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setPostToDelete(post.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">
                                {post.description.slice(0, 50)}...
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-3 w-3 text-primary" />
                                <span className="text-xs">{post.location}</span>
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
                        ))}
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

      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="profilePicture" className="text-sm font-medium">Аватар</label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={profileForm.previewUrl || (profile.profilePicture ? `http://localhost:5000${profile.profilePicture}` : "/placeholder.svg?height=64&width=64")}
                    alt="Превью аватара"
                  />
                  <AvatarFallback>АВ</AvatarFallback>
                </Avatar>
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                />
              </div>
              {errors.profilePicture && <p className="text-sm text-destructive">{errors.profilePicture}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="username" className="text-sm font-medium">Имя пользователя</label>
              <Input
                id="username"
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                placeholder="Введите имя пользователя"
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="bio" className="text-sm font-medium">Биография</label>
              <Textarea
                id="bio"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="Расскажите о себе"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="phone" className="text-sm font-medium">Телефон</label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+1234567890"
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="location" className="text-sm font-medium">Локация</label>
              <Input
                id="location"
                value={profileForm.location}
                onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                placeholder="Город, Страна"
              />
              {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
            </div>
            <div className="grid gap-2">
              <label htmlFor="newSkill" className="text-sm font-medium">Навыки</label>
              <div className="flex gap-2">
                <Input
                  id="newSkill"
                  value={profileForm.newSkill}
                  onChange={(e) => setProfileForm({ ...profileForm, newSkill: e.target.value })}
                  placeholder="Введите навык"
                  onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                />
                <Button onClick={handleAddSkill}>Добавить</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profileForm.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    className="flex items-center gap-1 bg-primary/10 text-primary"
                  >
                    {skill}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfileOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveProfile}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                      src={friend.profilePicture || "/placeholder.svg?height=40&width=40"}
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Удалить пост</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeletePost}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}