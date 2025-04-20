"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  MapPin,
  Bed,
  Bath,
  SquareIcon,
  Heart,
  MessageSquare,
  Search,
  Filter,
  Plus,
  ShoppingCart,
  Home,
  Calendar,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { NewListingModal } from "@/components/new-listing-modal";
import { useRouter } from "next/navigation";

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

export default function RealEstatePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [cart, setCart] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<Property[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState([50000, 500000]);
  const [sizeRange, setSizeRange] = useState([30, 200]);
  const [newListingOpen, setNewListingOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyType, setPropertyType] = useState("any");
  const [bedroomsFilter, setBedroomsFilter] = useState("Any");
  const [bathroomsFilter, setBathroomsFilter] = useState("Any");
  const [sortOption, setSortOption] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[RealEstatePage] Fetching posts from /api/posts");
      const propsRes = await fetch("http://localhost:5000/api/posts", {
        credentials: "include",
      });
      let propsData: any[];
      if (!propsRes.ok) {
        const text = await propsRes.text();
        console.error("[RealEstatePage] Posts fetch failed:", propsRes.status, text);
        propsData = [];
      } else {
        propsData = await propsRes.json();
        console.log("[RealEstatePage] Posts fetched:", propsData);
      }

      if (!Array.isArray(propsData)) {
        console.error("[RealEstatePage] Expected array, got:", propsData);
        throw new Error("Данные постов имеют некорректный формат");
      }

      const normalizedProperties: Property[] = propsData.map((post: any) => {
        const sellerData = post.seller || post.author || {};
        console.log(`[RealEstatePage] Processing post ${post.id}, seller/author:`, sellerData);
        return {
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
          imageUrls: Array.isArray(post.imageUrls)
            ? post.imageUrls.slice(0, 10)
            : ["/placeholder.svg"],
          createdAt: post.createdAt || new Date().toISOString(),
          likes: Array.isArray(post.likes) ? post.likes.map((like: any) => like.userId) : [],
          seller: {
            id: sellerData.id || 0,
            name: sellerData.username || sellerData.name || "Неизвестный пользователь",
            email: sellerData.email || "",
            phone: sellerData.phone || null,
            avatar: sellerData.profilePicture || sellerData.avatar || null,
            skills: Array.isArray(sellerData.skills) ? sellerData.skills : [],
          },
        };
      });

      setProperties(normalizedProperties);
      setFilteredProperties(normalizedProperties);
    } catch (error: any) {
      console.error("[RealEstatePage] Error fetching posts:", error);
      setError("Нет доступных объявлений. Попробуйте создать новое!");
      setProperties([]);
      setFilteredProperties([]);
      toast({
        title: "Информация",
        description: "Нет доступных объявлений. Попробуйте создать новое!",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !user.id) {
      console.log("[RealEstatePage] No user, resetting state");
      setProperties([]);
      setFilteredProperties([]);
      setCart([]);
      setCartItems([]);
      setFavorites([]);
      setIsLoading(false);
      setError("Пользователь не авторизован");
      return;
    }

    const userId = parseInt(user.id);

    const initializeData = async () => {
      await fetchPosts();

      // Load favorites
      try {
        const savedFavorites = JSON.parse(localStorage.getItem(`favorites-${userId}`) || "[]");
        setFavorites(savedFavorites);
      } catch (error) {
        console.error("[RealEstatePage] Error loading favorites:", error);
      }

      // Load cart
      try {
        const savedCart = JSON.parse(localStorage.getItem(`cart-${userId}`) || "[]");
        setCart(savedCart);
        if (savedCart.length > 0) {
          console.log("[RealEstatePage] Fetching cart items from /api/posts/multiple");
          const cartRes = await fetch("http://localhost:5000/api/posts/multiple", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postIds: savedCart }),
            credentials: "include",
          });
          if (!cartRes.ok) {
            const text = await cartRes.text();
            console.error("[RealEstatePage] Cart fetch failed:", cartRes.status, text);
            setCartItems([]);
            setCart([]);
            localStorage.setItem(`cart-${userId}`, JSON.stringify([]));
            toast({
              title: "Ошибка корзины",
              description: "Не удалось загрузить элементы корзины",
              variant: "destructive",
            });
          } else {
            const cartData = await cartRes.json();
            if (!Array.isArray(cartData)) {
              console.error("[RealEstatePage] Expected array for cart items, got:", cartData);
              setCartItems([]);
              setCart([]);
              localStorage.setItem(`cart-${userId}`, JSON.stringify([]));
              toast({
                title: "Ошибка корзины",
                description: "Данные корзины имеют некорректный формат",
                variant: "destructive",
              });
              return;
            }

            const validCartItems: Property[] = cartData
              .filter((item: any) => item.id)
              .map((item: any) => {
                const sellerData = item.seller || item.author || {};
                return {
                  id: item.id || 0,
                  authorId: item.authorId || 0,
                  title: item.title || "Без названия",
                  description: item.description || "",
                  location: item.location || "Не указано",
                  address: item.address ?? null,
                  propertyType: item.propertyType ?? null,
                  yearBuilt: item.yearBuilt ?? null,
                  price: item.price || 0,
                  bedrooms: item.bedrooms ?? null,
                  bathrooms: item.bathrooms ?? null,
                  squareMeters: item.squareMeters ?? null,
                  imageUrls: Array.isArray(item.imageUrls)
                    ? item.imageUrls.slice(0, 10)
                    : ["/placeholder.svg"],
                  createdAt: item.createdAt || new Date().toISOString(),
                  likes: Array.isArray(item.likes) ? item.likes.map((like: any) => like.userId) : [],
                  seller: {
                    id: sellerData.id || 0,
                    name: sellerData.username || sellerData.name || "Неизвестный пользователь",
                    email: sellerData.email || "",
                    phone: sellerData.phone || null,
                    avatar: sellerData.profilePicture || sellerData.avatar || null,
                    skills: Array.isArray(sellerData.skills) ? sellerData.skills : [],
                  },
                };
              });

            const validCartIds = validCartItems.map((item: Property) => item.id);
            setCartItems(validCartItems);
            if (validCartIds.length !== savedCart.length) {
              setCart(validCartIds);
              localStorage.setItem(`cart-${userId}`, JSON.stringify(validCartIds));
              toast({
                title: "Корзина обновлена",
                description: "Некоторые посты были удалены, так как они больше не существуют",
                variant: "default",
              });
            }
          }
        }
      } catch (error) {
        console.error("[RealEstatePage] Error loading cart:", error);
        setCartItems([]);
        setCart([]);
        localStorage.setItem(`cart-${userId}`, JSON.stringify([]));
      }
    };

    initializeData();
  }, [user, toast]);

  const applyFilters = () => {
    try {
      let filtered = [...properties];

      // Apply search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (property) =>
            (property.title && property.title.toLowerCase().includes(query)) ||
            (property.location && property.location.toLowerCase().includes(query)) ||
            (property.address && property.address.toLowerCase().includes(query)) ||
            (property.propertyType && property.propertyType.toLowerCase().includes(query)) ||
            (property.description && property.description.toLowerCase().includes(query))
        );
      }

      // Apply property type filter
      if (propertyType !== "any") {
        filtered = filtered.filter((property) => property.propertyType === propertyType);
      }

      // Apply bedrooms filter
      if (bedroomsFilter !== "Any") {
        const minBeds = parseInt(bedroomsFilter.replace("+", "")) || 0;
        filtered = filtered.filter((property) => (property.bedrooms || 0) >= minBeds);
      }

      // Apply bathrooms filter
      if (bathroomsFilter !== "Any") {
        const minBaths = parseInt(bathroomsFilter.replace("+", "")) || 0;
        filtered = filtered.filter((property) => (property.bathrooms || 0) >= minBaths);
      }

      // Apply price range filter
      filtered = filtered.filter((property) => {
        const price = property.price || 0;
        return price >= (priceRange[0] || 0) && price <= (priceRange[1] || Infinity);
      });

      // Apply size range filter
      filtered = filtered.filter((property) => {
        const size = property.squareMeters || 0;
        return size >= (sizeRange[0] || 0) && size <= (sizeRange[1] || Infinity);
      });

      // Apply sorting
      filtered.sort((a, b) => {
        if (sortOption === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortOption === "price-asc") {
          return (a.price || 0) - (b.price || 0);
        } else if (sortOption === "price-desc") {
          return (b.price || 0) - (a.price || 0);
        }
        return 0;
      });

      setFilteredProperties(filtered);
      console.log("[RealEstatePage] Filtered properties:", filtered);
      toast({
        title: "Фильтры применены",
        description: `Найдено ${filtered.length} объявлений`,
      });
    } catch (error: any) {
      console.error("[RealEstatePage] Error applying filters:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось применить фильтры. Попробуйте снова.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (properties.length > 0) {
      applyFilters();
    }
  }, [properties, searchQuery, propertyType, bedroomsFilter, bathroomsFilter, priceRange, sizeRange, sortOption]);

  const resetFilters = () => {
    setSearchQuery("");
    setPropertyType("any");
    setBedroomsFilter("Any");
    setBathroomsFilter("Any");
    setPriceRange([50000, 500000]);
    setSizeRange([30, 200]);
    setSortOption("newest");

    toast({
      title: "Фильтры сброшены",
      description: "Все фильтры сброшены до значений по умолчанию",
    });
  };

  const toggleFavorite = async (postId: number) => {
    if (!user || !user.id) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите, чтобы добавить в избранное",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    const userIdNum = parseInt(user.id);
    let newFavorites = [...favorites];
    try {
      console.log(`[toggleFavorite] Toggling favorite for postId: ${postId}`);
      const isFavorited = favorites.includes(postId);
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: "POST",
        credentials: "include",
      });

      const responseBody = await res.text();
      console.log(`[toggleFavorite] Response:`, {
        status: res.status,
        body: responseBody,
      });

      if (!res.ok) {
        let errorData: { message?: string } = {};
        try {
          errorData = JSON.parse(responseBody) as { message?: string };
        } catch (e) {
          console.error("[toggleFavorite] Failed to parse error response:", e);
        }
        throw new Error(errorData.message || "Не удалось изменить статус лайка");
      }

      // Parse response to get updated likes
      const updatedLikes = JSON.parse(responseBody).likes || [];
      newFavorites = isFavorited
        ? favorites.filter((id) => id !== postId)
        : [...favorites, postId];

      setFavorites(newFavorites);
      localStorage.setItem(`favorites-${userIdNum}`, JSON.stringify(newFavorites));

      // Update properties to reflect like status
      setProperties((prev) =>
        prev.map((prop) =>
          prop.id === postId
            ? {
                ...prop,
                likes: updatedLikes,
              }
            : prop
        )
      );
      setFilteredProperties((prev) =>
        prev.map((prop) =>
          prop.id === postId
            ? {
                ...prop,
                likes: updatedLikes,
              }
            : prop
        )
      );

      toast({
        title: "Успех",
        description: isFavorited
          ? "Объявление удалено из избранного"
          : "Объявление добавлено в избранное",
      });
    } catch (error: any) {
      console.error("[toggleFavorite] Error:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось изменить статус лайка",
        variant: "destructive",
      });
    }
  };

  const toggleCart = async (postId: number) => {
    if (!user || !user.id) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите, чтобы добавить в корзину",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    const userIdNum = parseInt(user.id);
    let newCart: number[];
    if (cart.includes(postId)) {
      newCart = cart.filter((id) => id !== postId);
      setCartItems((prev) => prev.filter((item) => item.id !== postId));
      toast({ title: "Удалено из корзины", description: `Пост ${postId}` });
    } else {
      newCart = [...cart, postId];
      const post = properties.find((p) => p.id === postId);
      if (post) {
        setCartItems((prev) => [...prev.filter((item) => item.id !== postId), post]);
        toast({ title: "Добавлено в корзину", description: `Пост ${postId}` });
      } else {
        try {
          const res = await fetch("http://localhost:5000/api/posts/multiple", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postIds: [postId] }),
            credentials: "include",
          });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to fetch post: ${res.status} ${text.slice(0, 100)}`);
          }
          const [fetchedPost] = await res.json();
          if (fetchedPost) {
            const sellerData = fetchedPost.seller || fetchedPost.author || {};
            const normalizedPost: Property = {
              id: fetchedPost.id || 0,
              authorId: fetchedPost.authorId || 0,
              title: fetchedPost.title || "Без названия",
              description: fetchedPost.description || "",
              location: fetchedPost.location || "Не указано",
              address: fetchedPost.address ?? null,
              propertyType: fetchedPost.propertyType ?? null,
              yearBuilt: fetchedPost.yearBuilt ?? null,
              price: fetchedPost.price || 0,
              bedrooms: fetchedPost.bedrooms ?? null,
              bathrooms: fetchedPost.bathrooms ?? null,
              squareMeters: fetchedPost.squareMeters ?? null,
              imageUrls: Array.isArray(fetchedPost.imageUrls)
                ? fetchedPost.imageUrls.slice(0, 10)
                : ["/placeholder.svg"],
              createdAt: fetchedPost.createdAt || new Date().toISOString(),
              likes: Array.isArray(fetchedPost.likes) ? fetchedPost.likes.map((like: any) => like.userId) : [],
              seller: {
                id: sellerData.id || 0,
                name: sellerData.username || sellerData.name || "Неизвестный пользователь",
                email: sellerData.email || "",
                phone: sellerData.phone || null,
                avatar: sellerData.profilePicture || sellerData.avatar || null,
                skills: Array.isArray(sellerData.skills) ? sellerData.skills : [],
              },
            };
            setCartItems((prev) => [...prev.filter((item) => item.id !== postId), normalizedPost]);
            toast({ title: "Добавлено в корзину", description: `Пост ${postId}` });
          }
        } catch (error) {
          console.error("[RealEstatePage] Error fetching post for cart:", error);
          toast({
            title: "Ошибка",
            description: "Не удалось добавить пост в корзину",
            variant: "destructive",
          });
          return;
        }
      }
    }
    setCart(newCart);
    localStorage.setItem(`cart-${userIdNum}`, JSON.stringify(newCart));
  };

  const openChat = (authorId: number) => {
    if (!user || !user.id) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите, чтобы начать чат",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    localStorage.setItem("activeChat", authorId.toString());
    router.push("/chat");
  };

  const removeFromCart = (postId: number) => {
    if (!user || !user.id) return;
    const userIdNum = parseInt(user.id);
    const newCart = cart.filter((id) => id !== postId);
    setCart(newCart);
    setCartItems((prev) => prev.filter((item) => item.id !== postId));
    localStorage.setItem(`cart-${userIdNum}`, JSON.stringify(newCart));
    toast({ title: "Удалено из корзины", description: `Пост ${postId}` });
  };

  const handleNewListingCreated = async (newPost: any) => {
    const userIdNum = parseInt(user?.id || "0");
    const sellerData = newPost.seller || newPost.author || {};
    const normalizedPost: Property = {
      id: newPost.id || 0,
      authorId: newPost.authorId || userIdNum,
      title: newPost.title || "Без названия",
      description: newPost.description || "",
      location: newPost.location || "Не указано",
      address: newPost.address ?? null,
      propertyType: newPost.propertyType ?? null,
      yearBuilt: newPost.yearBuilt ?? null,
      price: newPost.price || 0,
      bedrooms: newPost.bedrooms ?? null,
      bathrooms: newPost.bathrooms ?? null,
      squareMeters: newPost.squareMeters ?? null,
      imageUrls: Array.isArray(newPost.imageUrls)
        ? newPost.imageUrls.slice(0, 10)
        : ["/placeholder.svg"],
      createdAt: newPost.createdAt || new Date().toISOString(),
      likes: Array.isArray(newPost.likes) ? newPost.likes.map((like: any) => like.userId) : [],
      seller: {
        id: sellerData.id || userIdNum,
        name: sellerData.username || sellerData.name || user?.username || "Неизвестный пользователь",
        email: sellerData.email || user?.email || "",
        phone: sellerData.phone || user?.phone || null,
        avatar: sellerData.profilePicture || sellerData.avatar || user?.profilePicture || null,
        skills: Array.isArray(sellerData.skills) ? sellerData.skills : user?.skills || [],
      },
    };

    setProperties((prev) => [normalizedPost, ...prev]);
    setFilteredProperties((prev) => [normalizedPost, ...prev]);
    setNewListingOpen(false);
    toast({ title: "Успех", description: "Объявление создано" });

    // Refresh posts from server to ensure consistency
    await fetchPosts();
  };

  const viewDetails = (propertyId: number) => {
    router.push(`/real-estate/${propertyId}`);
  };

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Left Sidebar - Filters */}
        <div className="space-y-8">
          <div>
            <Button className="w-full bg-primary text-white hover:bg-primary/90">
              <MapPin className="mr-2 h-4 w-4" />
              Поиск на карте
            </Button>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">ФИЛЬТРЫ</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
                onClick={resetFilters}
              >
                Сбросить все
              </Button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Поиск недвижимости..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-medium">Тип недвижимости</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className={`flex h-auto flex-col gap-1 p-3 ${
                      propertyType === "apartment"
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary hover:bg-primary/5"
                    }`}
                    onClick={() => setPropertyType(propertyType === "apartment" ? "any" : "apartment")}
                  >
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
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                      <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
                      <path d="M12 3v6" />
                    </svg>
                    <span className="text-xs">Квартира</span>
                  </Button>

                  <Button
                    variant="outline"
                    className={`flex h-auto flex-col gap-1 p-3 ${
                      propertyType === "house"
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary hover:bg-primary/5"
                    }`}
                    onClick={() => setPropertyType(propertyType === "house" ? "any" : "house")}
                  >
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
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className="text-xs">Дом</span>
                  </Button>

                  <Button
                    variant="outline"
                    className={`flex h-auto flex-col gap-1 p-3 ${
                      propertyType === "villa"
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary hover:bg-primary/5"
                    }`}
                    onClick={() => setPropertyType(propertyType === "villa" ? "any" : "villa")}
                  >
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
                      className="h-6 w-6 text-primary"
                    >
                      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1" />
                      <path d="M17 3h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1" />
                      <path d="M12 3v10" />
                      <path d="M8 13v7" />
                      <path d="M16 13v7" />
                      <path d="M4 13h16" />
                    </svg>
                    <span className="text-xs">Вилла</span>
                  </Button>
                </div>

                <Select
                  value={propertyType}
                  onValueChange={(value) => setPropertyType(value)}
                >
                  <SelectTrigger className="mt-3 w-full">
                    <SelectValue placeholder="Выберите тип недвижимости" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Любой</SelectItem>
                    <SelectItem value="apartment">Квартира</SelectItem>
                    <SelectItem value="house">Дом</SelectItem>
                    <SelectItem value="villa">Вилла</SelectItem>
                    <SelectItem value="bungalow">Бунгало</SelectItem>
                    <SelectItem value="townhouse">Таунхаус</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium">Диапазон цен</h3>
                  <span className="text-sm text-muted-foreground">
                    €{priceRange[0].toLocaleString()} - €{priceRange[1].toLocaleString()}
                  </span>
                </div>
                <Slider
                  defaultValue={[50000, 500000]}
                  max={1000000}
                  min={0}
                  step={10000}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="py-4"
                />
                <div className="mt-2 flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                      className="pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                      EUR
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 1000000])}
                      className="pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                      EUR
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-medium">Спальни</h3>
                <div className="flex flex-wrap gap-2">
                  {["Any", "1+", "2+", "3+", "4+", "5+"].map((option) => (
                    <Button
                      key={option}
                      variant={option === bedroomsFilter ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 min-w-[60px] ${
                        option === bedroomsFilter
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "hover:border-primary hover:bg-primary/5"
                      }`}
                      onClick={() => setBedroomsFilter(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-medium">Ванные</h3>
                <div className="flex flex-wrap gap-2">
                  {["Any", "1+", "2+", "3+", "4+"].map((option) => (
                    <Button
                      key={option}
                      variant={option === bathroomsFilter ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 min-w-[60px] ${
                        option === bathroomsFilter
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "hover:border-primary hover:bg-primary/5"
                      }`}
                      onClick={() => setBathroomsFilter(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium">Диапазон площади</h3>
                  <span className="text-sm text-muted-foreground">
                    {sizeRange[0]} - {sizeRange[1]} м²
                  </span>
                </div>
                <Slider
                  defaultValue={[30, 200]}
                  max={500}
                  min={0}
                  step={5}
                  value={sizeRange}
                  onValueChange={setSizeRange}
                  className="py-4"
                />
                <div className="mt-2 flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={sizeRange[0]}
                      onChange={(e) => setSizeRange([Number(e.target.value) || 0, sizeRange[1]])}
                      className="pr-8"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                      м²
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={sizeRange[1]}
                      onChange={(e) => setSizeRange([sizeRange[0], Number(e.target.value) || 500])}
                      className="pr-8"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                      м²
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full bg-primary text-white hover:bg-primary/90"
                  onClick={applyFilters}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Применить фильтры
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Listings */}
        <div className="lg:col-span-3">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold">
              СПИСОК НЕДВИЖИМОСТИ{" "}
              <Badge className="ml-2 bg-primary/90 hover:bg-primary">
                {filteredProperties.length} из {properties.length}
              </Badge>
            </h1>
            <div className="flex items-center gap-2">
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Сортировать по" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Сначала новые</SelectItem>
                  <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
                  <SelectItem value="price-desc">Цена: по убыванию</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => {
                  if (!user) {
                    toast({
                      title: "Требуется авторизация",
                      description: "Пожалуйста, войдите, чтобы создать объявление",
                      variant: "destructive",
                    });
                    router.push("/login");
                    return;
                  }
                  setNewListingOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Новое объявление
              </Button>
              <Button variant="outline" onClick={() => setCartOpen(true)}>
                <ShoppingCart className="mr-2 h-4 w-4" /> Корзина ({cart.length})
              </Button>
            </div>
          </div>

          {error && <p className="text-center text-red-500 mb-4">{error}</p>}
          {isLoading ? (
            <p className="text-center text-gray-500">Загрузка постов...</p>
          ) : filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Объявления не найдены</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Попробуйте изменить критерии поиска или фильтры
              </p>
              <Button className="mt-4" variant="outline" onClick={resetFilters}>
                Сбросить все фильтры
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="relative h-48">
                    <Image
                      src={property.imageUrls.length > 0 ? property.imageUrls[0] : "/placeholder.svg"}
                      alt={property.title || "Property"}
                      fill
                      className="object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 h-8 w-8 bg-white/90 hover:bg-white"
                      onClick={() => toggleFavorite(property.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          favorites.includes(property.id) ? "fill-primary text-primary" : "text-gray-700"
                        }`}
                      />
                    </Button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">
                      <Link href={`/real-estate/${property.id}`} className="hover:underline">
                        {property.title || "Без названия"}
                      </Link>
                    </h3>
                    <div className="text-sm text-gray-500 mb-2 flex items-center">
                      <MapPin className="mr-1 h-4 w-4" />
                      {property.location || "Не указано"}
                      {property.address && ` • ${property.address}`}
                    </div>
                    <div className="flex flex-wrap gap-4 mb-2 text-sm">
                      {property.propertyType && (
                        <span className="flex items-center">
                          <Home className="h-4 w-4 mr-1" />
                          {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
                        </span>
                      )}
                      {property.bedrooms != null && (
                        <span className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />
                          {property.bedrooms} спальни
                        </span>
                      )}
                      {property.bathrooms != null && (
                        <span className="flex items-center">
                          <Bath className="h-4 w-4 mr-1" />
                          {property.bathrooms} ванные
                        </span>
                      )}
                      {property.squareMeters != null && (
                        <span className="flex items-center">
                          <SquareIcon className="h-4 w-4 mr-1" />
                          {property.squareMeters} м²
                        </span>
                      )}
                      {property.yearBuilt != null && (
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Построено в {property.yearBuilt}
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-bold text-blue-600 mb-2">
                      €{property.price ? property.price.toLocaleString() : "N/A"}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={property.seller.avatar || undefined} alt={property.seller.name} />
                        <AvatarFallback>{property.seller.name[0]}</AvatarFallback>
                      </Avatar>
                      {property.seller.id ? (
                        <Link href={`/profile/${property.seller.id}`} className="text-sm hover:underline">
                          {property.seller.name}
                        </Link>
                      ) : (
                        <span className="text-sm">{property.seller.name}</span>
                      )}
                    </div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {Array.isArray(property.seller.skills) && property.seller.skills.length > 0 ? (
                        property.seller.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Навыки не указаны</span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFavorite(property.id)}
                      >
                        <Heart
                          className={`h-4 w-4 mr-1 ${
                            favorites.includes(property.id) ? "fill-red-500 text-red-500" : ""
                          }`}
                        />
                        {favorites.includes(property.id) ? "Удалить" : "В избранное"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCart(property.id)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        {cart.includes(property.id) ? "Удалить" : "В корзину"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openChat(property.authorId)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Чат
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewDetails(property.id)}
                      >
                        Подробнее
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <NewListingModal
        open={newListingOpen}
        onOpenChange={setNewListingOpen}
        onPostCreated={handleNewListingCreated}
      />

      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Корзина</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {Array.isArray(cartItems) && cartItems.length > 0 ? (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={item.imageUrls.length > 0 ? item.imageUrls[0] : "/placeholder.svg"}
                      alt={item.title}
                      width={80}
                      height={60}
                      className="object-cover rounded"
                    />
                    <div>
                      <Link href={`/real-estate/${item.id}`} className="text-sm font-semibold hover:underline">
                        {item.title || "Без названия"}
                      </Link>
                      <p className="text-sm text-gray-500">
                        €{item.price ? item.price.toLocaleString() : "N/A"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Удалить
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Корзина пуста</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}