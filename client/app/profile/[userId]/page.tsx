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
import { Edit, Share2, Upload, UserPlus, Calendar, Users, Trash2, MapPin, Bed, Bath, SquareIcon, X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import ProtectedRoute from "@/components/protected-route";

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
  authorId: number;
  seller: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
    skills: string[];
  };
};

type FormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
  skills?: string;
};

export default function ProfilePage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = params && typeof params.userId === 'string' ? params.userId : null;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Property[]>([]);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    skills: [] as string[],
    newSkill: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProfile = async () => {
      if (!userId && !user) {
        toast({
          title: "Ошибка",
          description: "ID пользователя не указан и пользователь не авторизован",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      try {
        const url = userId
          ? `http://localhost:5000/api/profile/${userId}`
          : "http://localhost:5000/api/profile";
        console.log(`[ProfilePage] Fetching profile from ${url}`);

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
          if (response.status === 401) {
            throw new Error("Требуется авторизация");
          }
          if (response.status === 404) {
            throw new Error("Пользователь не найден");
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
        setProfile(normalizedProfile);
        setIsOwnProfile(!!user && String(user.id) === normalizedProfile.id);
        setProfileForm({
          firstName: normalizedProfile.username.split(" ")[0] || "",
          lastName: normalizedProfile.username.split(" ")[1] || "",
          email: normalizedProfile.email || "",
          phone: normalizedProfile.phone || "",
          bio: normalizedProfile.bio || "",
          location: normalizedProfile.location || "",
          skills: normalizedProfile.skills || [],
          newSkill: "",
        });
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error("[ProfilePage] Error fetching profile:", error.message);
        setProfile(null);
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось загрузить профиль",
          variant: "destructive",
        });
      }
    };

    const fetchPosts = async () => {
      try {
        const url = userId
          ? `http://localhost:5000/api/posts/user/${userId}`
          : "http://localhost:5000/api/posts/my";
        console.log(`[ProfilePage] Fetching posts from ${url}`);

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
          if (response.status === 401) {
            throw new Error("Требуется авторизация");
          }
          if (response.status === 404) {
            throw new Error("Посты пользователя не найдены");
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
              authorId: Number(post.authorId),
              seller: {
                id: Number(post.seller?.id || post.authorId),
                name: post.seller?.name || "",
                email: post.seller?.email || "",
                phone: post.seller?.phone || null,
                avatar: post.seller?.avatar || null,
                skills: Array.isArray(post.seller?.skills) ? post.seller.skills : [],
              },
            }))
          : [];
        setPosts(normalizedPosts);
      } catch (error: any) {
        if (error.name === 'AbortError') return;
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

    return () => {
      controller.abort();
    };
  }, [userId, user, toast, router]);

  const fetchFriends = async () => {
    if (!profile && !userId) {
      toast({
        title: "Ошибка",
        description: "Профиль или ID пользователя отсутствует",
        variant: "destructive",
      });
      return;
    }
    const controller = new AbortController();
    try {
      setLoading(true);
      const url = userId
        ? `http://localhost:5000/api/friends/${userId}`
        : "http://localhost:5000/api/friends";
      console.log(`[ProfilePage] Fetching friends from ${url}`);

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
      if (error.name === 'AbortError') return;
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
        throw new Error(`Не удалось удалить пост: ${response.status} ${errorText}`);
      }

      setPosts(posts.filter(post => post.id !== postToDelete));
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      toast({ title: "Успех", description: "Пост успешно удалён" });
    } catch (error: any) {
      console.error("[ProfilePage] Error deleting post:", error.message);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить пост",
        variant: "destructive",
      });
    }
  };

  const validateField = (name: string, value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    switch (name) {
      case "firstName": return value.trim() ? "" : "Имя обязательно";
      case "lastName": return value.trim() ? "" : "Фамилия обязательна";
      case "email": return value && emailRegex.test(value) ? "" : "Введите корректный email";
      case "phone": return !value || phoneRegex.test(value) ? "" : "Телефон должен быть в формате +1234567890";
      case "bio": return value.length <= 255 ? "" : "Биография должна быть короче 255 символов";
      case "location": return value.length <= 100 ? "" : "Локация должна быть короче 100 символов";
      case "newSkill": return value.length <= 50 ? "" : "Навык должен быть короче 50 символов";
      default: return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm({ ...profileForm, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleAddSkill = () => {
    const skill = profileForm.newSkill.trim();
    const error = validateField("newSkill", skill);
    if (error || !skill) {
      setErrors((prev) => ({ ...prev, skills: error || "Навык не может быть пустым" }));
      return;
    }
    if (profileForm.skills.includes(skill)) {
      setErrors((prev) => ({ ...prev, skills: "Этот навык уже добавлен" }));
      return;
    }
    setProfileForm({ ...profileForm, skills: [...profileForm.skills, skill], newSkill: "" });
    setErrors((prev) => ({ ...prev, skills: "" }));
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfileForm({
      ...profileForm,
      skills: profileForm.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setPhotoFile(e.target.files[0]);
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) {
      toast({ title: "Ошибка", description: "Фото не выбрано", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", photoFile);

    try {
      console.log("[ProfilePage] Uploading profile photo");
      const response = await fetch("http://localhost:5000/api/profile/upload-photo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      console.log("[ProfilePage] Photo upload response:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ProfilePage] Photo upload failed:", response.status, errorText);
        throw new Error(`Не удалось загрузить фото: ${response.status} ${errorText}`);
      }

      const updatedProfile = await response.json();
      setProfile({
        ...profile!,
        profilePicture: updatedProfile.profilePicture || null,
      });
      setPhotoFile(null);
      toast({ title: "Успех", description: "Фото успешно загружено" });
    } catch (error: any) {
      console.error("[ProfilePage] Error uploading photo:", error.message);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось загрузить фото",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    const newErrors: FormErrors = {
      firstName: validateField("firstName", profileForm.firstName),
      lastName: validateField("lastName", profileForm.lastName),
      email: validateField("email", profileForm.email),
      phone: validateField("phone", profileForm.phone),
      bio: validateField("bio", profileForm.bio),
      location: validateField("location", profileForm.location),
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some((error) => error)) {
      toast({
        title: "Ошибка",
        description: "Исправьте ошибки в форме",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("[ProfilePage] Saving profile:", profileForm);
      const response = await fetch("http://localhost:5000/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
          email: profileForm.email,
          phone: profileForm.phone || null,
          bio: profileForm.bio || null,
          location: profileForm.location || null,
          skills: profileForm.skills,
        }),
      });

      console.log("[ProfilePage] Profile save response:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ProfilePage] Profile save failed:", response.status, errorText);
        throw new Error(`Не удалось обновить профиль: ${response.status} ${errorText}`);
      }

      const updatedProfile = await response.json();
      setProfile({
        ...profile!,
        username: updatedProfile.username,
        email: updatedProfile.email,
        phone: updatedProfile.phone || null,
        bio: updatedProfile.bio || null,
        location: updatedProfile.location || null,
        skills: Array.isArray(updatedProfile.skills) ? updatedProfile.skills : [],
      });
      setEditProfileOpen(false);
      toast({ title: "Успех", description: "Профиль успешно обновлен" });
    } catch (error: any) {
      console.error("[ProfilePage] Error updating profile:", error.message);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить профиль",
        variant: "destructive",
      });
    }
  };

  const handleShareProfile = () => {
    if (!profile) {
      toast({
        title: "Ошибка",
        description: "Профиль не загружен",
        variant: "destructive",
      });
      return;
    }
    const profileUrl = `http://localhost:3000/profile/${profile.id}`;
    navigator.clipboard.writeText(profileUrl);
    toast({ title: "Успех", description: "Ссылка на профиль скопирована" });
    setShareDialogOpen(false);
  };

  const handleAddFriend = async () => {
    if (!profile || !user) {
      toast({
        title: "Ошибка",
        description: "Необходимо авторизоваться или профиль не загружен",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("[ProfilePage] Sending friend request to:", profile.id);
      const response = await fetch("http://localhost:5000/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ friendId: Number(profile.id) }),
      });

      console.log("[ProfilePage] Friend request response:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ProfilePage] Friend request failed:", response.status, errorText);
        throw new Error(`Не удалось отправить запрос: ${response.status} ${errorText}`);
      }

      toast({ title: "Успех", description: "Запрос в друзья отправлен" });
    } catch (error: any) {
      console.error("[ProfilePage] Error sending friend request:", error.message);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить запрос в друзья",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container px-4 py-8 md:px-6 md:py-12">Загрузка...</div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="container px-4 py-8 md:px-6 md:py-12">
          <h1 className="text-2xl font-bold">Пользователь не найден</h1>
          <Button onClick={() => router.push("/")} className="mt-4">
            Вернуться на главную
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
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
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-primary/20">
                    <AvatarImage
                      src={profile.profilePicture ? `http://localhost:5000${profile.profilePicture}` : "/placeholder.svg?height=96&width=96"}
                      alt={profile.username}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {profile.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <Button
                      size="icon"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-white hover:bg-primary/90"
                      onClick={() => setEditProfileOpen(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
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
                  <Badge variant="outline" className="bg-primary/5">{profile.eventsCount || 0}</Badge>
                </div>
                <Separator />
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={fetchFriends}
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Подписчики
                  </span>
                  <Badge variant="outline" className="bg-primary/5">{profile.friendsCount || 0}</Badge>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                {!isOwnProfile && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAddFriend}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Добавить в друзья
                  </Button>
                )}
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
                                  {isOwnProfile && (
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
                                  )}
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
                <Label htmlFor="firstName">Имя</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleInputChange}
                  placeholder="Введите имя"
                />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleInputChange}
                  placeholder="Введите фамилию"
                />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleInputChange}
                  placeholder="Введите email"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Биография</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profileForm.bio}
                  onChange={handleInputChange}
                  placeholder="Расскажите о себе"
                />
                {errors.bio && <p className="text-sm text-destructive">{errors.bio}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Локация</Label>
                <Input
                  id="location"
                  name="location"
                  value={profileForm.location}
                  onChange={handleInputChange}
                  placeholder="Город, Страна"
                />
                {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newSkill">Навыки</Label>
                <div className="flex gap-2">
                  <Input
                    id="newSkill"
                    name="newSkill"
                    value={profileForm.newSkill}
                    onChange={handleInputChange}
                    placeholder="Введите навык"
                    onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                  />
                  <Button onClick={handleAddSkill}>Добавить</Button>
                </div>
                {errors.skills && <p className="text-sm text-destructive">{errors.skills}</p>}
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
              <div className="grid gap-2">
                <Label htmlFor="photo">Фото профиля</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {photoFile && (
                  <Button onClick={handleUploadPhoto} className="mt-2">
                    <Upload className="mr-2 h-4 w-4" />
                    Загрузить фото
                  </Button>
                )}
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
    </ProtectedRoute>
  );
}