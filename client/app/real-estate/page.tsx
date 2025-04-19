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
  Plus,
  ShoppingCart,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { NewListingModal } from "@/components/new-listing-modal";

interface Seller {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string | null;
  skills: string[];
}

interface Property {
  id: number;
  authorId: number;
  title: string;
  description: string;
  location: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  imageUrl?: string | null;
  imageUrls?: string[]; // Добавлено для будущей совместимости
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
  const [friends, setFriends] = useState<number[]>([]);
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);
  const [priceRange, setPriceRange] = useState([0, Infinity]);
  const [sizeRange, setSizeRange] = useState([0, Infinity]);
  const [newListingOpen, setNewListingOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyType, setPropertyType] = useState("any");
  const [bedroomsFilter, setBedroomsFilter] = useState("Any");
  const [bathroomsFilter, setBathroomsFilter] = useState("Any");
  const [sortOption, setSortOption] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[RealEstatePage] useEffect triggered, userId:", user?.id || "no user");

    if (!user || !user.id) {
      console.log("[RealEstatePage] No user, resetting state");
      setProperties([]);
      setFilteredProperties([]);
      setFriends([]);
      setCart([]);
      setCartItems([]);
      setIsLoading(false);
      setError("Пользователь не авторизован");
      return;
    }

    const userId = parseInt(user.id);
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Получение постов
        console.log("[RealEstatePage] Fetching posts from /api/posts/feed");
        const propsRes = await fetch("http://localhost:5000/api/posts/feed", {
          credentials: "include",
        });
        if (!propsRes.ok) {
          const text = await propsRes.text();
          console.error("[RealEstatePage] Posts fetch failed:", propsRes.status, text);
          throw new Error(`Failed to fetch posts: ${propsRes.status} ${text.slice(0, 100)}`);
        }
        const propsData = await propsRes.json();
        console.log("[RealEstatePage] Posts fetched:", propsData);

        // Проверяем, что propsData — массив
        if (!Array.isArray(propsData)) {
          console.error("[RealEstatePage] Expected array, got:", propsData);
          setProperties([]);
          setFilteredProperties([]);
          throw new Error("Данные постов имеют некорректный формат");
        }

        // Нормализуем данные
        const normalizedProperties = propsData.map((post: any) => ({
          id: post.id || 0,
          authorId: post.authorId || 0,
          title: post.title || "Без названия",
          description: post.description || "",
          location: post.location || "Не указано",
          price: post.price || 0,
          bedrooms: post.bedrooms || undefined,
          bathrooms: post.bathrooms || undefined,
          squareMeters: post.squareMeters || undefined,
          imageUrl: post.imageUrl || null,
          imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls : post.imageUrl ? [post.imageUrl] : [], // Для совместимости
          createdAt: post.createdAt || new Date().toISOString(),
          likes: Array.isArray(post.likes) ? post.likes : [],
          seller: {
            id: post.seller?.id || 0,
            name: post.seller?.name || "Аноним",
            email: post.seller?.email || "",
            phone: post.seller?.phone || "",
            avatar: post.seller?.avatar || null,
            skills: Array.isArray(post.seller?.skills) ? post.seller.skills : [],
          },
        }));

        setProperties(normalizedProperties);
        setFilteredProperties(normalizedProperties);

        // Получение друзей
        console.log("[RealEstatePage] Fetching friends from /api/friends");
        const friendsRes = await fetch("http://localhost:5000/api/friends", {
          credentials: "include",
        });
        if (!friendsRes.ok) {
          const text = await friendsRes.text();
          console.error("[RealEstatePage] Friends fetch failed:", friendsRes.status, text);
          throw new Error(`Failed to fetch friends: ${friendsRes.status} ${text.slice(0, 100)}`);
        }
        const friendsData = await friendsRes.json();
        console.log("[RealEstatePage] Friends fetched:", friendsData);

        // Проверяем, что friendsData — массив
        if (!Array.isArray(friendsData)) {
          console.error("[RealEstatePage] Expected array for friends, got:", friendsData);
          setFriends([]);
        } else {
          setFriends(friendsData.map((f: { id: number }) => f.id) || []);
        }

        // Получение корзины
        const savedCart = JSON.parse(localStorage.getItem(`cart-${userId}`) || "[]");
        console.log("[RealEstatePage] Loaded cart:", savedCart);
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
            throw new Error(`Failed to fetch cart items: ${cartRes.status} ${text.slice(0, 100)}`);
          }
          const cartData = await cartRes.json();
          console.log("[RealEstatePage] Cart items fetched:", cartData);

          // Проверяем, что cartData — массив
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

          // Фильтруем несуществующие посты
          const validCartItems = cartData
            .filter((item: Property) => item.id)
            .map((item: any) => ({
              id: item.id || 0,
              authorId: item.authorId || 0,
              title: item.title || "Без названия",
              description: item.description || "",
              location: item.location || "Не указано",
              price: item.price || 0,
              bedrooms: item.bedrooms || undefined,
              bathrooms: item.bathrooms || undefined,
              squareMeters: item.squareMeters || undefined,
              imageUrl: item.imageUrl || null,
              imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [],
              createdAt: item.createdAt || new Date().toISOString(),
              likes: Array.isArray(item.likes) ? item.likes : [],
              seller: {
                id: item.seller?.id || 0,
                name: item.seller?.name || "Аноним",
                email: item.seller?.email || "",
                phone: item.seller?.phone || "",
                avatar: item.seller?.avatar || null,
                skills: Array.isArray(item.seller?.skills) ? item.seller.skills : [],
              },
            }));

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
      } catch (error: any) {
        console.error("[RealEstatePage] Error fetching data:", error);
        setError(error.message || "Не удалось загрузить данные");
        setProperties([]);
        setFilteredProperties([]);
        setCart([]);
        setCartItems([]);
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось загрузить данные",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, toast]);

  useEffect(() => {
    console.log("[RealEstatePage] Filtering properties, count:", properties.length);
    if (!Array.isArray(properties)) {
      console.error("[RealEstatePage] Properties is not an array:", properties);
      setFilteredProperties([]);
      return;
    }

    let filtered = [...properties];

    if (showFriendsOnly && friends.length > 0) {
      filtered = filtered.filter((p) => friends.includes(p.authorId));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.title?.toLowerCase()?.includes(query) || false) ||
          (p.description?.toLowerCase()?.includes(query) || false) ||
          (p.location?.toLowerCase()?.includes(query) || false)
      );
    }

    if (propertyType !== "any") {
      filtered = filtered.filter((p) =>
        p.title?.toLowerCase()?.includes(propertyType.toLowerCase())
      );
    }

    if (bedroomsFilter !== "Any") {
      const minBeds = parseInt(bedroomsFilter.replace("+", ""));
      filtered = filtered.filter((p) => (p.bedrooms || 0) >= minBeds);
    }

    if (bathroomsFilter !== "Any") {
      const minBaths = parseInt(bathroomsFilter.replace("+", ""));
      filtered = filtered.filter((p) => (p.bathrooms || 0) >= minBaths);
    }

    filtered = filtered.filter((p) => {
      const price = p.price || 0;
      return price >= priceRange[0] && price <= (priceRange[1] || Infinity);
    });

    filtered = filtered.filter((p) => {
      const size = p.squareMeters || 0;
      return size >= sizeRange[0] && size <= (sizeRange[1] || Infinity);
    });

    filtered.sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === "price-asc") {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortOption === "price-desc") {
        return (b.price || 0) - (a.price || 0);
      }
      return 0;
    });

    setFilteredProperties(filtered);
    console.log("[RealEstatePage] Filtered properties:", filtered);
  }, [
    properties,
    searchQuery,
    propertyType,
    bedroomsFilter,
    bathroomsFilter,
    priceRange,
    sizeRange,
    sortOption,
    showFriendsOnly,
    friends,
  ]);

  const toggleLike = async (postId: number) => {
    if (!user || !user.id) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите, чтобы поставить лайк",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("[RealEstatePage] Like failed:", res.status, text);
        throw new Error(`Failed to update like: ${res.status} ${text.slice(0, 100)}`);
      }
      const updatedPost = await res.json();
      setProperties((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: Array.isArray(updatedPost.likes) ? updatedPost.likes : [] } : p))
      );
      setFilteredProperties((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: Array.isArray(updatedPost.likes) ? updatedPost.likes : [] } : p))
      );
      toast({
        title: Array.isArray(updatedPost.likes) && updatedPost.likes.includes(parseInt(user.id)) ? "Лайк поставлен" : "Лайк убран",
        description: `Пост ${postId}`,
      });
    } catch (error) {
      console.error("[RealEstatePage] Error updating like:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить лайк",
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

    let newCart: number[];
    if (cart.includes(postId)) {
      newCart = cart.filter((id) => id !== postId);
      setCartItems((prev) => prev.filter((item) => item.id !== postId));
      toast({ title: "Удалено из корзины", description: `Пост ${postId}` });
    } else {
      newCart = [...cart, postId];
      const post = properties.find((p) => p.id === postId);
      if (post) {
        setCartItems((prev) => [...prev, post]);
        toast({ title: "Добавлено в корзину", description: `Пост ${postId}` });
      }
    }
    setCart(newCart);
    localStorage.setItem(`cart-${user.id}`, JSON.stringify(newCart));
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
    const newCart = cart.filter((id) => id !== postId);
    setCart(newCart);
    setCartItems((prev) => prev.filter((item) => item.id !== postId));
    localStorage.setItem(`cart-${user.id}`, JSON.stringify(newCart));
    toast({ title: "Удалено из корзины", description: `Пост ${postId}` });
  };

  const handleNewListingCreated = (newPost: Property) => {
    const normalizedPost = {
      ...newPost,
      imageUrls: Array.isArray(newPost.imageUrls) ? newPost.imageUrls : newPost.imageUrl ? [newPost.imageUrl] : [],
      likes: Array.isArray(newPost.likes) ? newPost.likes : [],
      seller: {
        id: newPost.seller?.id || 0,
        name: newPost.seller?.name || "Аноним",
        email: newPost.seller?.email || "",
        phone: newPost.seller?.phone || "",
        avatar: newPost.seller?.avatar || null,
        skills: Array.isArray(newPost.seller?.skills) ? newPost.seller.skills : [],
      },
    };
    setProperties((prev) => [normalizedPost, ...prev]);
    setFilteredProperties((prev) => [normalizedPost, ...prev]);
    setNewListingOpen(false);
    toast({ title: "Успех", description: "Объявление создано" });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Недвижимость</h1>
        {user && (
          <div className="flex gap-2">
            <Button onClick={() => setNewListingOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Создать объявление
            </Button>
            <Button variant="outline" onClick={() => setCartOpen(true)}>
              <ShoppingCart className="mr-2 h-4 w-4" /> Корзина ({cart.length})
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/4">
          <Card className="p-4 sticky top-4">
            <h2 className="text-lg font-semibold mb-4">Фильтры</h2>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Тип недвижимости" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Любой</SelectItem>
                  <SelectItem value="house">Дом</SelectItem>
                  <SelectItem value="apartment">Квартира</SelectItem>
                  <SelectItem value="condo">Кондоминиум</SelectItem>
                </SelectContent>
              </Select>
              <Select value={bedroomsFilter} onValueChange={setBedroomsFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Спальни" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">Любое</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
              <Select value={bathroomsFilter} onValueChange={setBathroomsFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Ванные" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">Любое</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                </SelectContent>
              </Select>
              <div>
                <label className="text-sm font-medium">Цена (€)</label>
                <Slider
                  min={0}
                  max={1000000}
                  step={1000}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="mt-2"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>€{priceRange[0].toLocaleString()}</span>
                  <span>€{priceRange[1]?.toLocaleString() || "∞"}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Площадь (м²)</label>
                <Slider
                  min={0}
                  max={500}
                  step={1}
                  value={sizeRange}
                  onValueChange={setSizeRange}
                  className="mt-2"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{sizeRange[0]} м²</span>
                  <span>{sizeRange[1]?.toString() || "∞"} м²</span>
                </div>
              </div>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger>
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Новейшие</SelectItem>
                  <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
                  <SelectItem value="price-desc">Цена: по убыванию</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={showFriendsOnly ? "default" : "outline"}
                onClick={() => setShowFriendsOnly(!showFriendsOnly)}
                className="w-full"
              >
                Только друзья
              </Button>
            </div>
          </Card>
        </div>

        <div className="w-full md:w-3/4">
          {error && (
            <p className="text-center text-red-500 mb-4">{error}</p>
          )}
          {isLoading ? (
            <p className="text-center text-gray-500">Загрузка постов...</p>
          ) : !Array.isArray(properties) || properties.length === 0 ? (
            <p className="text-center text-gray-500">Нет доступных постов</p>
          ) : !Array.isArray(filteredProperties) || filteredProperties.length === 0 ? (
            <p className="text-center text-gray-500">Объявления не найдены</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="relative h-48">
                    <Image
                      src={property.imageUrl || "/placeholder.svg"}
                      alt={property.title || "Property"}
                      fill
                      className="object-cover"
                    />
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
                    </div>
                    <div className="flex flex-wrap gap-4 mb-2 text-sm">
                      {property.bedrooms && (
                        <span className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />
                          {property.bedrooms} спальни
                        </span>
                      )}
                      {property.bathrooms && (
                        <span className="flex items-center">
                          <Bath className="h-4 w-4 mr-1" />
                          {property.bathrooms} ванные
                        </span>
                      )}
                      {property.squareMeters && (
                        <span className="flex items-center">
                          <SquareIcon className="h-4 w-4 mr-1" />
                          {property.squareMeters} м²
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
                      <Link href={`/profile/${property.authorId}`} className="text-sm hover:underline">
                        {property.seller.name || "Аноним"}
                      </Link>
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleLike(property.id)}
                      >
                        <Heart
                          className={`h-4 w-4 mr-1 ${
                            Array.isArray(property.likes) && property.likes.includes(parseInt(user?.id || "0"))
                              ? "fill-red-500 text-red-500"
                              : ""
                          }`}
                        />
                        {Array.isArray(property.likes) ? property.likes.length : 0}
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
                      src={item.imageUrl || "/placeholder.svg"}
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