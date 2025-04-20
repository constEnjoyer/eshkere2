"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Bed, Bath, SquareIcon, Heart, MessageSquare, ChevronLeft, ChevronRight, Home, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

interface Seller {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar?: string | null;
  skills: string[];
}

interface Property {
  id: number;
  authorId: number;
  title: string;
  description: string;
  location: string;
  address?: string | null;
  propertyType?: string | null;
  yearBuilt?: number | null;
  price: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareMeters?: number | null;
  imageUrls: string[];
  createdAt: string;
  likes: number[];
  seller: Seller;
}

export default function PropertyPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = typeof params.id === "string" ? parseInt(params.id) : NaN;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    if (isNaN(postId)) {
      setError("Недействительный ID поста");
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        console.log(`[PropertyPage] Fetching post with ID: ${postId}`);
        const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) throw new Error("Пост не найден");
          throw new Error(`Не удалось загрузить пост: ${response.status}`);
        }

        const post = await response.json();
        console.log("[PropertyPage] Post fetched:", post);

        const normalizedPost: Property = {
          id: post.id || 0,
          authorId: post.authorId || 0,
          title: post.title || "Без названия",
          description: post.description || "",
          location: post.location || "Не указано",
          address: post.address ?? null,
          propertyType: post.propertyType ?? null,
          yearBuilt: post.yearBuilt ?? null,
          price: post.price || 0,
          bedrooms: post.bedrooms ?? null,
          bathrooms: post.bathrooms ?? null,
          squareMeters: post.squareMeters ?? null,
          imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls : ["/placeholder.svg"],
          createdAt: post.createdAt || new Date().toISOString(),
          likes: Array.isArray(post.likes) ? post.likes : [],
          seller: {
            id: post.seller?.id || 0,
            name: post.seller?.name || "Аноним",
            email: post.seller?.email || "",
            phone: post.seller?.phone || null,
            avatar: post.seller?.avatar || null,
            skills: Array.isArray(post.seller?.skills) ? post.seller.skills : [],
          },
        };

        setProperty(normalizedPost);
      } catch (error: any) {
        console.error("[PropertyPage] Error fetching post:", error);
        setError(error.message || "Не удалось загрузить пост");
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось загрузить пост",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const loadFavorites = () => {
      if (user && user.id) {
        try {
          const savedFavorites = JSON.parse(localStorage.getItem(`favorites-${user.id}`) || "[]");
          setFavorites(savedFavorites);
        } catch (error) {
          console.error("[PropertyPage] Error loading favorites:", error);
        }
      }
    };

    fetchPost();
    loadFavorites();
  }, [postId, user, toast]);

  const toggleFavorite = async () => {
    if (!user || !user.id) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите, чтобы добавить в избранное",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    if (!property) return;

    try {
      const userIdNum = parseInt(user.id);
      let newFavorites = [...favorites];
      if (favorites.includes(property.id)) {
        const res = await fetch(`http://localhost:5000/api/posts/${property.id}/unlike`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Не удалось убрать лайк");
        newFavorites = favorites.filter(id => id !== property.id);
        toast({ title: "Удалено из избранного", description: "Пост удалён из избранного" });
      } else {
        const res = await fetch(`http://localhost:5000/api/posts/${property.id}/like`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Не удалось поставить лайк");
        newFavorites = [...favorites, property.id];
        toast({ title: "Добавлено в избранное", description: "Пост добавлен в избранное" });
      }

      setFavorites(newFavorites);
      localStorage.setItem(`favorites-${user.id}`, JSON.stringify(newFavorites));
      setProperty(prev => prev ? {
        ...prev,
        likes: newFavorites.includes(property.id)
          ? [...prev.likes, userIdNum]
          : prev.likes.filter(id => id !== userIdNum),
      } : null);
    } catch (error) {
      console.error("[PropertyPage] Error toggling favorite:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус избранного",
        variant: "destructive",
      });
    }
  };

  const openChat = () => {
    if (!user || !user.id) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите, чтобы начать чат",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    if (!property) return;
    localStorage.setItem("activeChat", property.authorId.toString());
    router.push("/chat");
  };

  const nextImage = () => {
    if (property && property.imageUrls.length > 0) {
      setCurrentImageIndex(prev => (prev + 1) % property.imageUrls.length);
    }
  };

  const prevImage = () => {
    if (property && property.imageUrls.length > 0) {
      setCurrentImageIndex(prev => prev === 0 ? property.imageUrls.length - 1 : prev - 1);
    }
  };

  if (loading) {
    return <div className="container px-4 py-8">Загрузка...</div>;
  }

  if (error || !property) {
    return (
      <div className="container px-4 py-8">
        <h1 className="text-2xl font-bold">Пост не найден</h1>
        <p className="text-red-500">{error || "Не удалось загрузить пост"}</p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <h1 className="text-2xl font-bold mb-6">{property.title}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative h-96 rounded-lg overflow-hidden">
            <Image
              src={property.imageUrls[currentImageIndex] || "/placeholder.svg"}
              alt={property.title}
              fill
              className="object-cover"
            />
            {property.imageUrls.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {property.imageUrls.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-gray-400"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <p className="text-gray-600 mt-4">{property.description}</p>
        </div>
        <div>
          <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900">
            <h2 className="text-lg font-semibold mb-4">Детали недвижимости</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">{property.location}</span>
              </div>
              {property.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm">{property.address}</span>
                </div>
              )}
              {property.propertyType && (
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-primary" />
                  <span className="text-sm">{property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}</span>
                </div>
              )}
              {property.bedrooms != null && (
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-primary" />
                  <span className="text-sm">{property.bedrooms} спальни</span>
                </div>
              )}
              {property.bathrooms != null && (
                <div className="flex items-center gap-2">
                  <Bath className="h-4 w-4 text-primary" />
                  <span className="text-sm">{property.bathrooms} ванные</span>
                </div>
              )}
              {property.squareMeters != null && (
                <div className="flex items-center gap-2">
                  <SquareIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm">{property.squareMeters} м²</span>
                </div>
              )}
              {property.yearBuilt != null && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">Построено в {property.yearBuilt}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">€{property.price.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-2">Продавец</h3>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={property.seller.avatar || undefined} alt={property.seller.name} />
                  <AvatarFallback>{property.seller.name[0]}</AvatarFallback>
                </Avatar>
                <Link href={`/profile/${property.seller.id}`} className="text-sm hover:underline">
                  {property.seller.name}
                </Link>
                <span className="text-sm text-muted-foreground">({property.seller.email})</span>
              </div>
              {property.seller.phone && (
                <div className="text-sm mt-1">{property.seller.phone}</div>
              )}
              {property.seller.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {property.seller.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-2 flex-wrap">
              <Button variant="outline" onClick={toggleFavorite}>
                <Heart
                  className={`h-4 w-4 mr-1 ${favorites.includes(property.id) ? "fill-red-500 text-red-500" : ""}`}
                />
                {favorites.includes(property.id) ? "Удалить из избранного" : "В избранное"}
              </Button>
              <Button variant="outline" onClick={openChat}>
                <MessageSquare className="h-4 w-4 mr-1" />
                Чат с продавцом
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}