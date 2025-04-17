"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, Share2, Upload, UserPlus, Calendar, Users, Trash2, Plus } from "lucide-react";
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
import ProtectedRoute from "@/components/protected-route";

type Profile = {
  id: number;
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
  id: number;
  username: string;
  profilePicture?: string | null;
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
  const userId = params.userId as string; // Получаем ID из URL
  const [profile, setProfile] = useState<Profile | null>(null);
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

  useEffect(() => {
    console.log("[ProfilePage] useEffect triggered, userId:", userId);
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const url = userId
          ? `http://localhost:5000/api/profile/${userId}`
          : "http://localhost:5000/api/profile";
        console.log(`[ProfilePage] Fetching profile from ${url}`);

        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Failed to fetch profile: ${response.status}`
          );
        }

        const data: Profile = await response.json();
        console.log("[ProfilePage] Profile fetched:", data);
        setProfile(data);

        // Проверяем, является ли это профилем текущего пользователя
        const myProfileResponse = await fetch("http://localhost:5000/api/profile", {
          method: "GET",
          credentials: "include",
        });
        if (!myProfileResponse.ok) {
          throw new Error("Failed to fetch my profile");
        }
        const myProfile = await myProfileResponse.json();
        setIsOwnProfile(myProfile.id === data.id);

        setProfileForm({
          firstName: data.username.split(" ")[0] || "",
          lastName: data.username.split(" ")[1] || "",
          email: data.email || "",
          phone: data.phone || "",
          bio: data.bio || "",
          location: data.location || "",
          skills: data.skills || [],
          newSkill: "",
        });
      } catch (error) {
        console.error("[ProfilePage] Error fetching profile:", error);
        toast({
          title: "Ошибка",
          description:
            error instanceof Error ? error.message : "Не удалось загрузить профиль",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    } else {
      console.log("[ProfilePage] No userId provided, fetching current user profile");
      fetchProfile();
    }
  }, [userId, toast]);

  const fetchFriends = async () => {
    try {
      console.log(
        `[ProfilePage] Fetching friends from /api/friends${userId ? `/${userId}` : ""}`
      );
      const url = userId
        ? `http://localhost:5000/api/friends/${userId}`
        : "http://localhost:5000/api/friends";
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch friends");
      }

      const data: Friend[] = await response.json();
      console.log("[ProfilePage] Friends fetched:", data);
      setFriends(data);
      setFriendsDialogOpen(true);
    } catch (error) {
      console.error("[ProfilePage] Error fetching friends:", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error ? error.message : "Не удалось загрузить друзей",
        variant: "destructive",
      });
    }
  };

  const validateField = (name: string, value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    switch (name) {
      case "firstName":
        return value.trim() ? "" : "Имя обязательно";
      case "lastName":
        return value.trim() ? "" : "Фамилия обязательна";
      case "email":
        return value && emailRegex.test(value) ? "" : "Введите корректный email";
      case "phone":
        return !value || phoneRegex.test(value)
          ? ""
          : "Телефон должен быть в формате +1234567890";
      case "bio":
        return value.length <= 255
          ? ""
          : "Биография должна быть короче 255 символов";
      case "location":
        return value.length <= 100
          ? ""
          : "Локация должна быть короче 100 символов";
      case "newSkill":
        return value.length <= 50
          ? ""
          : "Навык должен быть короче 50 символов";
      default:
        return "";
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileForm({ ...profileForm, [name]: value });
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleAddSkill = () => {
    const skill = profileForm.newSkill.trim();
    const error = validateField("newSkill", skill);
    if (error || !skill) {
      setErrors((prev) => ({
        ...prev,
        skills: error || "Навык не может быть пустым",
      }));
      return;
    }
    if (profileForm.skills.includes(skill)) {
      setErrors((prev) => ({ ...prev, skills: "Этот навык уже добавлен" }));
      return;
    }
    setProfileForm({
      ...profileForm,
      skills: [...profileForm.skills, skill],
      newSkill: "",
    });
    setErrors((prev) => ({ ...prev, skills: "" }));
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfileForm({
      ...profileForm,
      skills: profileForm.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) {
      toast({
        title: "Ошибка",
        description: "Фото не выбрано",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", photoFile);

    try {
      console.log("[ProfilePage] Uploading photo to /api/profile/upload-photo");
      const response = await fetch(
        "http://localhost:5000/api/profile/upload-photo",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload photo");
      }

      const updatedProfile = await response.json();
      console.log("[ProfilePage] Photo uploaded, updated profile:", updatedProfile);
      setProfile(updatedProfile);
      setPhotoFile(null);
      toast({ title: "Успех", description: "Фото успешно загружено" });
    } catch (error) {
      console.error("[ProfilePage] Error uploading photo:", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error ? error.message : "Не удалось загрузить фото",
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
      console.log("[ProfilePage] Saving profile to /api/profile/update");
      const response = await fetch("http://localhost:5000/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: `${profileForm.firstName} ${profileForm.lastName}`,
          email: profileForm.email,
          phone: profileForm.phone || null,
          bio: profileForm.bio || null,
          location: profileForm.location || null,
          skills: profileForm.skills,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedProfile = await response.json();
      console.log("[ProfilePage] Profile updated:", updatedProfile);
      setProfile(updatedProfile);
      setEditProfileOpen(false);
      toast({ title: "Успех", description: "Профиль успешно обновлен" });
    } catch (error) {
      console.error("[ProfilePage] Error updating profile:", error);
      toast({
        title: "Ошибка",
        description:
          error instanceof Error ? error.message : "Не удалось обновить профиль",
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
    const profileUrl = `https://realestatepro.com/profile/${profile.username.replace(
      " ",
      "-"
    )}`;
    navigator.clipboard.writeText(profileUrl);
    console.log("[ProfilePage] Profile link copied:", profileUrl);
    toast({ title: "Успех", description: "Ссылка на профиль скопирована" });
    setShareDialogOpen(false);
  };

  if (loading) return <div className="container px-4 py-8">Загрузка...</div>;

  if (!profile) {
    return (
      <div className="container px-4 py-8">
        <h1 className="text-2xl font-bold">Пользователь не найден</h1>
      </div>
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
                      src={
                        profile.profilePicture ||
                        "/placeholder.svg?height=96&width=96"
                      }
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
                  <p className="text-sm text-muted-foreground">
                    Агент по недвижимости
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    События
                  </span>
                  <Badge variant="outline" className="bg-primary/5">
                    {profile.eventsCount}
                  </Badge>
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
                  <Badge variant="outline" className="bg-primary/5">
                    {profile.friendsCount}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2">
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
              <Tabs defaultValue="about-company">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                  <TabsTrigger
                    value="about-company"
                    className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                  >
                    О КОМПАНИИ
                  </TabsTrigger>
                  <TabsTrigger
                    value="agent-info"
                    className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                  >
                    ИНФОРМАЦИЯ ОБ АГЕНТЕ
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="about-company" className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-primary">О НАС</h2>
                      <div className="mt-4 rounded-lg border p-4 bg-muted/30">
                        <p className="text-muted-foreground">
                          {profile.bio || "Биография не указана"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-primary">НАВЫКИ</h2>
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
                          <p className="text-muted-foreground">
                            Навыки не указаны
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="agent-info" className="p-6">
                  <h2 className="text-xl font-bold">Информация об агенте</h2>
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <h3 className="flex items-center gap-2 font-medium">
                        <Users className="h-5 w-5 text-primary" />
                        Контактные данные
                      </h3>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/5">
                            Email
                          </Badge>
                          <span className="text-sm">{profile.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/5">
                            Телефон
                          </Badge>
                          <span className="text-sm">
                            {profile.phone || "Не указан"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/5">
                            Офис
                          </Badge>
                          <span className="text-sm">
                            {profile.location || "Не указан"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>

        {isOwnProfile && (
          <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Редактировать профиль
                </DialogTitle>
                <DialogDescription>
                  Обновите вашу личную информацию.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24 border-4 border-primary/20">
                    <AvatarImage
                      src={
                        photoFile
                          ? URL.createObjectURL(photoFile)
                          : profile.profilePicture ||
                            "/placeholder.svg?height=96&width=96"
                      }
                      alt="Профиль"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {profile.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="w-auto"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUploadPhoto}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Загрузить
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={profileForm.firstName}
                      onChange={handleInputChange}
                      className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={profileForm.lastName}
                      onChange={handleInputChange}
                      className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleInputChange}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Биография</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={profileForm.bio}
                    onChange={handleInputChange}
                    className={errors.bio ? "border-red-500" : ""}
                  />
                  {errors.bio && (
                    <p className="text-red-500 text-sm">{errors.bio}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Локация</Label>
                  <Input
                    id="location"
                    name="location"
                    value={profileForm.location}
                    onChange={handleInputChange}
                    className={errors.location ? "border-red-500" : ""}
                  />
                  {errors.location && (
                    <p className="text-red-500 text-sm">{errors.location}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Навыки</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profileForm.skills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {skill}
                        <Trash2
                          className="h-4 w-4 cursor-pointer text-red-500"
                          onClick={() => handleRemoveSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      name="newSkill"
                      value={profileForm.newSkill}
                      onChange={handleInputChange}
                      placeholder="Добавить новый навык"
                      className={errors.skills ? "border-red-500" : ""}
                    />
                    <Button variant="outline" onClick={handleAddSkill}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.skills && (
                    <p className="text-red-500 text-sm">{errors.skills}</p>
                  )}
                </div>
              </div>

              <DialogFooter className="sticky bottom-0 bg-background pt-4 dark:bg-gray-900">
                <Button
                  variant="outline"
                  onClick={() => setEditProfileOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleSaveProfile}
                >
                  Сохранить изменения
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Поделиться профилем
              </DialogTitle>
              <DialogDescription>
                Поделитесь вашим профилем с другими.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Ссылка на профиль</Label>
                <Input
                  readOnly
                  value={
                    profile.username
                      ? `https://realestatepro.com/profile/${profile.username.replace(
                          " ",
                          "-"
                        )}`
                      : "Профиль не загружен"
                  }
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleShareProfile}>Скопировать ссылку</Button>
              <Button
                variant="outline"
                onClick={() => setShareDialogOpen(false)}
              >
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={friendsDialogOpen} onOpenChange={setFriendsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Друзья
              </DialogTitle>
              <DialogDescription>Ваш список друзей.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            friend.profilePicture ||
                            "/placeholder.svg?height=40&width=40"
                          }
                          alt={friend.username}
                        />
                        <AvatarFallback>
                          {friend.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{friend.username}</span>
                    </div>
                    <Link href={`/profile/${friend.id}`}>
                      <Button variant="outline" size="sm">
                        Посмотреть профиль
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Друзей пока нет.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}

function Home(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}