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
  const userId = params.userId; // Получаем ID из URL
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
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const url = userId
          ? `http://localhost:5000/api/profile/${userId}`
          : "http://localhost:5000/api/profile";
        console.log(`[Frontend] Fetching profile from ${url}`);
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch profile");
        }

        const data: Profile = await response.json();
        setProfile(data);

        // Проверяем, является ли это профилем текущего пользователя
        const myProfileResponse = await fetch("http://localhost:5000/api/profile", {
          method: "GET",
          credentials: "include",
        });
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
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const fetchFriends = async () => {
    try {
      console.log(userId)
      console.log(`[Frontend] Fetching friends from /api/friends${userId ? `/${userId}` : ''}`);
      const url = userId
        ? `http://localhost:5000/api/friends/${userId}`
        : "http://localhost:5000/api/friends";
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch friends");
      }

      const data: Friend[] = await response.json();
      setFriends(data);
      setFriendsDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load friends",
        variant: "destructive",
      });
    }
  };

  const validateField = (name: string, value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    switch (name) {
      case "firstName":
        return value.trim() ? "" : "First name is required";
      case "lastName":
        return value.trim() ? "" : "Last name is required";
      case "email":
        return value && emailRegex.test(value) ? "" : "Valid email is required";
      case "phone":
        return !value || phoneRegex.test(value) ? "" : "Phone must be in format +1234567890";
      case "bio":
        return value.length <= 255 ? "" : "Bio must be less than 255 characters";
      case "location":
        return value.length <= 100 ? "" : "Location must be less than 100 characters";
      case "newSkill":
        return value.length <= 50 ? "" : "Skill must be less than 50 characters";
      default:
        return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm({ ...profileForm, [name]: value });
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleAddSkill = () => {
    const skill = profileForm.newSkill.trim();
    const error = validateField("newSkill", skill);
    if (error || !skill) {
      setErrors((prev) => ({ ...prev, skills: error || "Skill cannot be empty" }));
      return;
    }
    if (profileForm.skills.includes(skill)) {
      setErrors((prev) => ({ ...prev, skills: "Skill already exists" }));
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
      toast({ title: "Error", description: "No photo selected", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", photoFile);

    try {
      const response = await fetch("http://localhost:5000/api/profile/upload-photo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload photo");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setPhotoFile(null);
      toast({ title: "Success", description: "Photo uploaded successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload photo",
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
        title: "Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    try {
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
      setProfile(updatedProfile);
      setEditProfileOpen(false);
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleShareProfile = () => {
    if (!profile) {
      toast({ title: "Error", description: "Profile not loaded", variant: "destructive" });
      return;
    }
    const profileUrl = `https://realestatepro.com/profile/${profile.username.replace(" ", "-")}`;
    navigator.clipboard.writeText(profileUrl);
    toast({ title: "Success", description: "Profile link copied to clipboard" });
    setShareDialogOpen(false);
  };

  if (loading) return <div className="container px-4 py-8">Loading...</div>;

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
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage
                    src={profile?.profilePicture || "/placeholder.svg?height=96&width=96"}
                    alt={profile?.username}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {profile?.username?.slice(0, 2).toUpperCase() || "RB"}
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
                <h2 className="text-xl font-bold">{profile?.username}</h2>
                <p className="text-sm text-muted-foreground">Real estate agent</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Events
                </span>
                <Badge variant="outline" className="bg-primary/5">
                  {profile?.eventsCount ?? 0}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between cursor-pointer" onClick={fetchFriends}>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Followers
                </span>
                <Badge variant="outline" className="bg-primary/5">
                  {profile?.friendsCount ?? 0}
                </Badge>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="outline" className="w-full" onClick={() => setShareDialogOpen(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
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
                  ABOUT COMPANY
                </TabsTrigger>
                <TabsTrigger
                  value="agent-info"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                >
                  AGENT INFO
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about-company" className="p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-primary">ABOUT</h2>
                    <div className="mt-4 rounded-lg border p-4 bg-muted/30 w-full max-w-[600px]">
                      <p className="text-muted-foreground ">{profile?.bio || "No bio provided"}</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-primary">SKILLS</h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile?.skills?.map((skill, index) => (
                        <Badge
                          key={index}
                          className="bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          {skill}
                        </Badge>
                      )) || <p className="text-muted-foreground">No skills listed</p>}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="agent-info" className="p-6">
                <h2 className="text-xl font-bold">Agent Information</h2>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h3 className="flex items-center gap-2 font-medium">
                      <Users className="h-5 w-5 text-primary" />
                      Contact Details
                    </h3>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5">
                          Email
                        </Badge>
                        <span className="text-sm">{profile?.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5">
                          Phone
                        </Badge>
                        <span className="text-sm">{profile?.phone || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5">
                          Office
                        </Badge>
                        <span className="text-sm">{profile?.location || "Not provided"}</span>
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
                Edit Profile
              </DialogTitle>
              <DialogDescription>Update your personal information.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage
                    src={
                      photoFile
                        ? URL.createObjectURL(photoFile)
                        : profile?.profilePicture || "/placeholder.svg?height=96&width=96"
                    }
                    alt="Profile"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {profile?.username?.slice(0, 2).toUpperCase() || "RB"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Input type="file" accept="image/*" onChange={handlePhotoChange} className="w-auto" />
                  <Button variant="outline" size="sm" onClick={handleUploadPhoto}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={handleInputChange}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={handleInputChange}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
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
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleInputChange}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={profileForm.bio}
                  onChange={handleInputChange}
                  className={errors.bio ? "border-red-500" : ""}
                />
                {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={profileForm.location}
                  onChange={handleInputChange}
                  className={errors.location ? "border-red-500" : ""}
                />
                {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
              </div>

              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profileForm.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
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
                    placeholder="Add new skill"
                    className={errors.skills ? "border-red-500" : ""}
                  />
                  <Button variant="outline" onClick={handleAddSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {errors.skills && <p className="text-red-500 text-sm">{errors.skills}</p>}
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-background pt-4 dark:bg-gray-900">
              <Button variant="outline" onClick={() => setEditProfileOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveProfile}>
                Save changes
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
              Share Profile
            </DialogTitle>
            <DialogDescription>Share your profile with others.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Profile Link</Label>
              <Input
                readOnly
                value={
                  profile?.username
                    ? `https://realestatepro.com/profile/${profile.username.replace(" ", "-")}`
                    : "Profile not loaded"
                }
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleShareProfile}>Copy Link</Button>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={friendsDialogOpen} onOpenChange={setFriendsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Friends
            </DialogTitle>
            <DialogDescription>Your list of friends.</DialogDescription>
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
                        src={friend.profilePicture || "/placeholder.svg?height=40&width=40"}
                        alt={friend.username}
                      />
                      <AvatarFallback>{friend.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{friend.username}</span>
                  </div>
                  <Link href={`/profile/${friend.id}`}>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No friends yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
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