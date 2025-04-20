"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, SquareIcon, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";

interface Agent {
  id: string;
  username: string;
  profilePicture?: string | null;
  friendsCount: number;
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
  likes: number;
  createdAt: string;
  author: { id: string; username: string; profilePicture?: string | null };
}

export default function HomePage() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [topAgents, setTopAgents] = useState<Agent[]>([]);
  const [trendingProperties, setTrendingProperties] = useState<Property[]>([]);
  const [feedPosts, setFeedPosts] = useState<Property[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("Новинки");

  const filters = ["Новинки", "Популярные", "Самые дешевые", "Самые дорогие"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Получение топ-6 агентов
        console.log("[HomePage] Fetching top agents...");
        const agentsResponse = await fetch("http://localhost:5000/api/posts/top-agents", {
          credentials: "include",
        });
        console.log("[HomePage] Agents response:", {
          status: agentsResponse.status,
          ok: agentsResponse.ok,
        });
        let agents: Agent[] = [];
        if (agentsResponse.ok) {
          agents = await agentsResponse.json();
          console.log("[HomePage] Agents fetched:", agents);
        } else {
          const errorText = await agentsResponse.text();
          console.error("[HomePage] Agents fetch error:", errorText);
          toast({ title: "Ошибка", description: "Не удалось загрузить агентов", variant: "destructive" });
        }

        // Заполнение шаблонными агентами, если меньше 6
        const placeholderAgents: Agent[] = Array.from({ length: 6 - agents.length }, (_, i) => ({
          id: `placeholder-${i}`,
          username: `Агент ${i + 1}`,
          profilePicture: null,
          friendsCount: 0,
        }));
        agents = [...agents, ...placeholderAgents].slice(0, 6);
        setTopAgents(agents);

        // Получение топ-6 trending properties
        console.log("[HomePage] Fetching trending properties...");
        const trendingResponse = await fetch("http://localhost:5000/api/posts/trending", {
          credentials: "include",
        });
        console.log("[HomePage] Trending response:", {
          status: trendingResponse.status,
          ok: trendingResponse.ok,
        });
        let properties: Property[] = [];
        if (trendingResponse.ok) {
          properties = await trendingResponse.json();
          console.log("[HomePage] Trending properties fetched:", properties);
        } else {
          const errorText = await trendingResponse.text();
          console.error("[HomePage] Trending fetch error:", errorText);
          toast({ title: "Ошибка", description: "Не удалось загрузить trending properties", variant: "destructive" });
        }

        // Заполнение шаблонными properties, если меньше 6
        const placeholderProperties: Property[] = Array.from(
          { length: 6 - properties.length },
          (_, i) => ({
            id: -i - 1,
            title: `Property ${i + 1}`,
            description: "Placeholder property",
            location: "Unknown",
            price: 0,
            imageUrls: ["/placeholder.svg?height=80&width=80"],
            likes: 0,
            createdAt: new Date().toISOString(),
            author: { id: "0", username: "Unknown", profilePicture: null },
          })
        );
        properties = [...properties, ...placeholderProperties].slice(0, 6);
        setTrendingProperties(properties);

        // Получение ленты постов
        console.log("[HomePage] Fetching feed posts...");
        const feedResponse = await fetch("http://localhost:5000/api/posts/feed", {
          credentials: "include",
        });
        console.log("[HomePage] Feed response:", {
          status: feedResponse.status,
          ok: feedResponse.ok,
        });
        let posts: Property[] = [];
        if (feedResponse.ok) {
          posts = await feedResponse.json();
          console.log("[HomePage] Feed posts fetched:", posts);
        } else {
          const errorText = await feedResponse.text();
          console.error("[HomePage] Feed fetch error:", errorText);
          toast({ title: "Ошибка", description: "Не удалось загрузить посты", variant: "destructive" });
        }
        setFeedPosts(posts);
        setFilteredPosts(posts);
      } catch (error: any) {
        console.error("[HomePage] Error:", error.message, error.stack);
        toast({ title: "Ошибка", description: "Произошла ошибка при загрузке данных", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Применение фильтров
  useEffect(() => {
    let sortedPosts = [...feedPosts];
    switch (selectedFilter) {
      case "Новинки":
        sortedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "Популярные":
        sortedPosts.sort((a, b) => b.likes - a.likes);
        break;
      case "Самые дешевые":
        sortedPosts.sort((a, b) => a.price - b.price);
        break;
      case "Самые дорогие":
        sortedPosts.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }
    setFilteredPosts(sortedPosts);
  }, [selectedFilter, feedPosts]);

  const toggleFavorite = async (postId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Ошибка",
        description: "Войдите, чтобы добавить в избранное",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[HomePage] Toggle favorite error:", errorText);
        throw new Error(`Не удалось обновить лайк: ${errorText}`);
      }
      const { likes } = await response.json();

      setFeedPosts(posts =>
        posts.map(post =>
          post.id === postId ? { ...post, likes: likes.length } : post
        )
      );
      setTrendingProperties(props =>
        props.map(prop =>
          prop.id === postId ? { ...prop, likes: likes.length } : prop
        )
      );

      if (favorites.includes(postId)) {
        setFavorites(favorites.filter(id => id !== postId));
        toast({ title: "Удалено из избранного", description: "Объект удален из избранного" });
      } else {
        setFavorites([...favorites, postId]);
        toast({ title: "Добавлено в избранное", description: "Объект добавлен в избранное" });
      }
    } catch (error: any) {
      console.error("[HomePage] Toggle favorite error:", error.message);
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="container px-4 py-8">Загрузка...</div>;
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Левая колонка: Топ агенты и Trending Properties */}
        <div className="space-y-8">
          {/* Топ агенты */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900"
          >
            <h2 className="text-lg font-bold text-primary mb-4">ТОП АГЕНТЫ</h2>
            <div className="space-y-4">
              {topAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Link href={`/profile/${agent.id}`} className="flex items-center gap-3 w-full">
                    <Avatar className="h-12 w-12 border-2 border-primary/10 transition-all group-hover:border-primary">
                      <AvatarImage
                        src={agent.profilePicture || "/placeholder.svg?height=48&width=48"}
                        alt={agent.username}
                        onLoad={() => console.log(`[HomePage] Avatar loaded for ${agent.username}: ${agent.profilePicture}`)}
                        onError={() => console.error(`[HomePage] Failed to load avatar for ${agent.username}: ${agent.profilePicture}`)}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {agent.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium group-hover:text-primary transition-colors">
                        {agent.username}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {agent.friendsCount} подписчиков
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trending Properties */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900"
          >
            <h2 className="text-lg font-bold text-primary mb-4">TRENDING PROPERTIES</h2>
            <div className="space-y-4">
              {trendingProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Link href={`/real-estate/${property.id}`} className="flex items-center gap-3 flex-1">
                    <div className="relative h-16 w-16 overflow-hidden rounded-md">
                      <Image
                        src={property.imageUrls[0] || "/placeholder.svg?height=80&width=80"}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-110"
                        onError={() => console.error(`[HomePage] Failed to load property image for ${property.title}: ${property.imageUrls[0]}`)}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium group-hover:text-primary transition-colors">
                        {property.title}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" />
                        {property.location}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Heart className="mr-1 h-3 w-3" />
                        {property.likes} лайков
                      </div>
                    </div>
                  </Link>
                  {property.id > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => toggleFavorite(property.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${favorites.includes(property.id) ? "fill-primary text-primary" : ""}`}
                      />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Правая колонка: Лента постов */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h1 className="text-2xl font-bold text-primary">НОВОСТНОЙ ФИД</h1>
            {/* Фильтры */}
            <div className="flex flex-wrap gap-2">
              {filters.map(filter => (
                <Button
                  key={filter}
                  variant={selectedFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
            {filteredPosts.length === 0 ? (
              <p className="text-muted-foreground">Посты отсутствуют</p>
            ) : (
              filteredPosts.map(post => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={post.author.profilePicture || "/placeholder.svg?height=40&width=40"}
                        alt={post.author.username}
                        onLoad={() => console.log(`[HomePage] Post author avatar loaded for ${post.author.username}: ${post.author.profilePicture}`)}
                        onError={() => console.error(`[HomePage] Failed to load post author avatar for ${post.author.username}: ${post.author.profilePicture}`)}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {post.author.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/profile/${post.author.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {post.author.username}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/real-estate/${post.id}`}>
                      <h3 className="text-lg font-semibold hover:underline">{post.title}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="relative h-48 mt-4 rounded-md overflow-hidden">
                      <Image
                        src={post.imageUrls[0] || "/placeholder.svg?height=200&width=300"}
                        alt={post.title}
                        fill
                        className="object-cover"
                        onError={() => console.error(`[HomePage] Failed to load post image for ${post.title}: ${post.imageUrls[0]}`)}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm">{post.location}</span>
                    </div>
                    <div className="flex gap-3 mt-2">
                      {post.bedrooms && (
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4 text-primary" />
                          <span className="text-sm">{post.bedrooms}</span>
                        </div>
                      )}
                      {post.bathrooms && (
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4 text-primary" />
                          <span className="text-sm">{post.bathrooms}</span>
                        </div>
                      )}
                      {post.squareMeters && (
                        <div className="flex items-center gap-1">
                          <SquareIcon className="h-4 w-4 text-primary" />
                          <span className="text-sm">{post.squareMeters} м²</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-lg font-bold text-primary">
                        €{post.price.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => toggleFavorite(post.id)}
                        >
                          <Heart
                            className={`h-4 w-4 ${favorites.includes(post.id) ? "fill-primary text-primary" : ""}`}
                          />
                        </Button>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          {post.likes} лайков
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}