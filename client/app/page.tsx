"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Eye, ChevronRight, Star, MapPin, Heart, MessageSquare, Share2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Agent {
  id: string;
  name: string;
  rating: string;
  reviews: number;
}

interface TrendingProperty {
  id: string;
  name: string;
  location: string;
  viewers: string;
  image: string;
}

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  image: string;
  url: string;
}

export default function HomePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showAllAgents, setShowAllAgents] = useState(false);
  const [showAllTrending, setShowAllTrending] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [visibleArticles, setVisibleArticles] = useState<number>(6);

  // Список агентов
  const agents: Agent[] = [
    { id: "agent1", name: "Cooper Vaccaro", rating: "5.0", reviews: 124 },
    { id: "agent2", name: "Livia Mango", rating: "5.0", reviews: 98 },
    { id: "agent3", name: "Jordyn Lipshutz", rating: "5.0", reviews: 76 },
    { id: "agent4", name: "Ruben Bothman", rating: "4.9", reviews: 112 },
    { id: "agent5", name: "Theresa Steward", rating: "4.8", reviews: 89 },
    { id: "agent6", name: "Andriy Koshelevich", rating: "4.7", reviews: 64 },
  ];

  // Трендовые объекты недвижимости
  const trendingProperties: TrendingProperty[] = [
    {
      id: "studio1",
      name: "Studio apartment",
      location: "Barcelona",
      viewers: "6,340",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: "villa1",
      name: "Villa in Kiev",
      location: "Ukraine",
      viewers: "5,210",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: "apt1",
      name: "Apartment in NYC",
      location: "United States",
      viewers: "4,980",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: "house1",
      name: "Beach House",
      location: "Marbella, Spain",
      viewers: "4,750",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: "condo1",
      name: "Modern Condo",
      location: "Miami, USA",
      viewers: "4,320",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: "villa2",
      name: "Mountain Villa",
      location: "Swiss Alps",
      viewers: "3,890",
      image: "/placeholder.svg?height=80&width=80",
    },
  ];

  // Новостные статьи
  const newsArticles: NewsArticle[] = [
    {
      id: "news1",
      title: "Housing Market Trends for 2025",
      description: "Experts predict a stabilization in home prices with increased demand in urban areas.",
      category: "Market Trends",
      date: "April 18, 2025",
      image: "/placeholder.svg?height=200&width=300",
      url: "/news/housing-market-2025",
    },
    {
      id: "news2",
      title: "Top 10 Home Renovation Tips",
      description: "Maximize your home's value with these cost-effective renovation ideas.",
      category: "Home Tips",
      date: "April 17, 2025",
      image: "/placeholder.svg?height=200&width=300",
      url: "/news/home-renovation-tips",
    },
    {
      id: "news3",
      title: "New Regulations Impacting Real Estate",
      description: "Learn about the latest laws affecting property sales and rentals.",
      category: "Industry News",
      date: "April 16, 2025",
      image: "/placeholder.svg?height=200&width=300",
      url: "/news/real-estate-regulations",
    },
    {
      id: "news4",
      title: "Sustainable Living: Eco-Friendly Homes",
      description: "Discover how to make your home more environmentally friendly.",
      category: "Home Tips",
      date: "April 15, 2025",
      image: "/placeholder.svg?height=200&width=300",
      url: "/news/eco-friendly-homes",
    },
    {
      id: "news5",
      title: "Urban vs. Suburban: Where to Buy?",
      description: "Comparing the pros and cons of urban and suburban home purchases.",
      category: "Market Trends",
      date: "April 14, 2025",
      image: "/placeholder.svg?height=200&width=300",
      url: "/news/urban-vs-suburban",
    },
    {
      id: "news6",
      title: "Tech Innovations in Real Estate",
      description: "How AI and VR are transforming property tours and sales.",
      category: "Industry News",
      date: "April 13, 2025",
      image: "/placeholder.svg?height=200&width=300",
      url: "/news/tech-in-real-estate",
    },
    {
      id: "news7",
      title: "First-Time Homebuyer Guide",
      description: "Essential tips for navigating the homebuying process.",
      category: "Home Tips",
      date: "April 12, 2025",
      image: "/placeholder.svg?height=200&width=300",
      url: "/news/first-time-homebuyer",
    },
    {
      id: "news8",
      title: "Global Real Estate Market Outlook",
      description: "A look at international trends shaping the property market.",
      category: "Market Trends",
      date: "April 11, 2025",
      image: "/placeholder.svg?height=200&width=300",
      url: "/news/global-market-outlook",
    },
  ];

  // Категории для фильтрации
  const categories = ["All", "Market Trends", "Home Tips", "Industry News"];

  // Фильтрованные статьи
  const filteredArticles = selectedCategory === "All"
    ? newsArticles
    : newsArticles.filter(article => article.category === selectedCategory);

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((item) => item !== id));
      toast({
        title: "Removed from favorites",
        description: "Property has been removed from your favorites",
      });
    } else {
      setFavorites([...favorites, id]);
      toast({
        title: "Added to favorites",
        description: "Property has been added to your favorites",
      });
    }
  };

  const handleMessageArticle = (articleId: string) => {
    setSelectedArticle(articleId);
    setMessageDialogOpen(true);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message before sending",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Message sent",
      description: `Your inquiry about the article has been sent`,
    });

    setMessageText("");
    setMessageDialogOpen(false);
    setSelectedArticle(null);
  };

  const handleLoadMore = () => {
    setVisibleArticles(prev => prev + 6);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Left Sidebar */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900"
          >
            <h2 className="mb-4 text-lg font-bold text-primary">TRUSTED AGENTS</h2>
            <div className="space-y-4">
              {agents.slice(0, showAllAgents ? agents.length : 3).map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => router.push(`/profile/${agent.id}`)}
                >
                  <Avatar className="h-12 w-12 border-2 border-primary/10 transition-all group-hover:border-primary">
                    <AvatarImage src={`/placeholder.svg?height=48&width=48`} alt={agent.name} />
                    <AvatarFallback>
                      {agent.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium group-hover:text-primary transition-colors">{agent.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="mr-1 h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>{agent.rating}</span>
                      <span className="mx-1">•</span>
                      <span>{agent.reviews} reviews</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-primary"
                onClick={() => setShowAllAgents(!showAllAgents)}
              >
                {showAllAgents ? "Show less" : "View all agents"}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900"
          >
            <h2 className="mb-4 text-lg font-bold text-primary">TRENDING PROPERTIES</h2>
            <div className="space-y-4">
              {trendingProperties.slice(0, showAllTrending ? trendingProperties.length : 3).map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => router.push(`/real-estate/${property.id}`)}
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-md">
                    <Image
                      src={property.image || "/placeholder.svg"}
                      alt={property.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium group-hover:text-primary transition-colors">{property.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-1 h-3 w-3" />
                      {property.location}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Eye className="mr-1 h-3 w-3" />
                      {property.viewers} views
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(property.id);
                    }}
                  >
                    <Heart
                      className={`h-4 w-4 ${favorites.includes(property.id) ? "fill-primary text-primary" : ""}`}
                    />
                  </Button>
                </motion.div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-primary"
                onClick={() => setShowAllTrending(!showAllTrending)}
              >
                {showAllTrending ? "Show less" : "View all trending"}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* News Feed */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category);
                    setVisibleArticles(6); // Сброс пагинации при смене категории
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* News Articles */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2"
            >
              {filteredArticles.slice(0, visibleArticles).map((article) => (
                <motion.div key={article.id} variants={item}>
                  <Card
                    className="overflow-hidden group cursor-pointer flex flex-col md:flex-row"
                    onClick={() => router.push(article.url)}
                  >
                    <div className="relative h-48 md:h-auto md:w-1/3 overflow-hidden">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <CardContent className="p-4 flex-1">
                      <Badge className="mb-2 bg-primary/90 hover:bg-primary">{article.category}</Badge>
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">{article.date}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMessageArticle(article.id);
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`https://realestatepro.com${article.url}`);
                              toast({
                                title: "Link copied",
                                description: "Article link has been copied to clipboard",
                              });
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Load More Button */}
            {visibleArticles < filteredArticles.length && (
              <div className="text-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                >
                  Load More
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Inquire About Article
            </DialogTitle>
            <DialogDescription>
              Send an inquiry about this article to our team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                rows={5}
                placeholder="Hi, I'm interested in learning more about this topic..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMessageDialogOpen(false);
                setMessageText("");
                setSelectedArticle(null);
              }}
            >
              Cancel
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSendMessage}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}