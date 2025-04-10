"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Eye, ChevronRight, Star, MapPin, ArrowRight, Heart, MessageSquare, Share2, Filter } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function HomePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("catalogue")
  const [favorites, setFavorites] = useState<string[]>([])
  const [showAllAgents, setShowAllAgents] = useState(false)
  const [showAllTrending, setShowAllTrending] = useState(false)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [sortDialogOpen, setSortDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")

  // Expanded agent list
  const [agents, setAgents] = useState([
    { id: "agent1", name: "Cooper Vaccaro", rating: "5.0", reviews: 124 },
    { id: "agent2", name: "Livia Mango", rating: "5.0", reviews: 98 },
    { id: "agent3", name: "Jordyn Lipshutz", rating: "5.0", reviews: 76 },
    { id: "agent4", name: "Ruben Bothman", rating: "4.9", reviews: 112 },
    { id: "agent5", name: "Theresa Steward", rating: "4.8", reviews: 89 },
    { id: "agent6", name: "Andriy Koshelevich", rating: "4.7", reviews: 64 },
  ])

  // Expanded trending properties
  const [trendingProperties, setTrendingProperties] = useState([
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
  ])

  // Featured properties
  const [featuredProperties, setFeaturedProperties] = useState([
    {
      id: "italy1",
      country: "ITALY",
      location: "Venice",
      price: "€450,000",
      views: "6,340",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "spain1",
      country: "SPAIN",
      location: "Barcelona",
      price: "€320,000",
      views: "6,340",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "turkey1",
      country: "TURKEY",
      location: "Istanbul",
      price: "€180,000",
      views: "6,340",
      image: "/placeholder.svg?height=200&width=300",
    },
  ])

  // Countries
  const [countries, setCountries] = useState([
    {
      id: "ukraine1",
      country: "UKRAINE",
      properties: 24,
      views: "6,340",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "russia1",
      country: "RUSSIA",
      properties: 18,
      views: "6,340",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "australia1",
      country: "AUSTRALIA",
      properties: 32,
      views: "6,340",
      image: "/placeholder.svg?height=200&width=300",
    },
  ])

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((item) => item !== id))
      toast({
        title: "Removed from favorites",
        description: "Property has been removed from your favorites",
      })
    } else {
      setFavorites([...favorites, id])
      toast({
        title: "Added to favorites",
        description: "Property has been added to your favorites",
      })
    }
  }

  const handleMessageAgent = (agentId: string) => {
    setSelectedAgent(agentId)
    setMessageDialogOpen(true)
  }

  const handleMessageProperty = (propertyId: string) => {
    setSelectedProperty(propertyId)
    setMessageDialogOpen(true)
  }

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message before sending",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Message sent",
      description: selectedAgent
        ? `Your message has been sent to ${agents.find((a) => a.id === selectedAgent)?.name}`
        : `Your inquiry about this property has been sent`,
    })

    setMessageText("")
    setMessageDialogOpen(false)
    setSelectedAgent(null)
    setSelectedProperty(null)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

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
                  onClick={() => handleMessageAgent(agent.id)}
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
                      e.stopPropagation()
                      toggleFavorite(property.id)
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

        {/* Main Content */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold">Hello, Ruben Bothman!</h1>
                <p className="mt-2 text-muted-foreground">
                  Welcome back to your real estate dashboard. You have{" "}
                  <button className="text-primary font-medium hover:underline" onClick={() => router.push("/chat")}>
                    3 new messages
                  </button>{" "}
                  and{" "}
                  <button
                    className="text-primary font-medium hover:underline"
                    onClick={() => router.push("/real-estate")}
                  >
                    5 new leads
                  </button>
                  .
                </p>
              </div>
              <Image
                src="/placeholder.svg?height=150&width=150"
                alt="Illustration"
                width={150}
                height={150}
                className="hidden md:block"
              />
            </div>

            <Tabs defaultValue="catalogue" value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger
                  value="catalogue"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  CATALOGUE
                </TabsTrigger>
                <TabsTrigger
                  value="community"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  COMMUNITY
                </TabsTrigger>
              </TabsList>

              <TabsContent value="catalogue" className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 bg-primary/5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Your Listings</h3>
                      <Badge variant="outline">12 active</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      You have 12 active listings with 342 total views this week
                    </p>
                    <Button
                      variant="link"
                      className="mt-2 h-8 px-0 text-primary"
                      onClick={() => router.push("/profile?tab=listing-services")}
                    >
                      Manage listings
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>

                  <div className="rounded-lg border p-4 bg-primary/5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Recent Activity</h3>
                      <Badge variant="outline">24h</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      3 new inquiries and 5 new property views in the last 24 hours
                    </p>
                    <Button
                      variant="link"
                      className="mt-2 h-8 px-0 text-primary"
                      onClick={() => router.push("/real-estate")}
                    >
                      View activity
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="community" className="mt-6 space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Community Updates</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Connect with 245+ real estate professionals in your area
                  </p>
                  <div className="mt-4 flex -space-x-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Avatar key={i} className="border-2 border-background">
                        <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                        <AvatarFallback>U{i}</AvatarFallback>
                      </Avatar>
                    ))}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                      +24
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4 w-full" onClick={() => router.push("/partners")}>
                    Join community discussions
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

          <div>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-bold">Featured Properties</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setFilterDialogOpen(true)}>
                  Filter
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSortDialogOpen(true)}>
                  Sort: Newest
                </Button>
                <Button variant="default" size="sm" onClick={() => router.push("/real-estate")}>
                  View all
                </Button>
              </div>
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {featuredProperties.map((location) => (
                <motion.div key={location.id} variants={item}>
                  <Card
                    className="overflow-hidden group cursor-pointer"
                    onClick={() => router.push(`/real-estate/${location.id}`)}
                  >
                    <div className="relative">
                      <div className="absolute top-2 right-2 z-10 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-black/20 text-white backdrop-blur-sm hover:bg-black/30 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(location.id)
                          }}
                        >
                          <Heart
                            className={`h-4 w-4 ${favorites.includes(location.id) ? "fill-primary text-primary" : ""}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-black/20 text-white backdrop-blur-sm hover:bg-black/30 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMessageProperty(location.id)
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-black/20 text-white backdrop-blur-sm hover:bg-black/30 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(`https://realestatepro.com/property/${location.id}`)
                            toast({
                              title: "Link copied",
                              description: "Property link has been copied to clipboard",
                            })
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={location.image || "/placeholder.svg"}
                          alt={location.country}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge className="bg-primary/90 hover:bg-primary">{location.country}</Badge>
                              <h3 className="mt-1 text-lg font-medium">{location.location}</h3>
                            </div>
                            <div className="flex items-center text-sm">
                              <Eye className="mr-1 h-4 w-4" />
                              {location.views}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Starting from</div>
                          <div className="text-xl font-bold">{location.price}</div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/real-estate/${location.id}`)
                          }}
                        >
                          View details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <div className="mt-12 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-bold">Explore by Country</h2>
              <Button variant="outline" size="sm" onClick={() => router.push("/real-estate?view=countries")}>
                View all countries
              </Button>
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {countries.map((location) => (
                <motion.div key={location.id} variants={item}>
                  <Card
                    className="overflow-hidden group cursor-pointer"
                    onClick={() => router.push(`/real-estate?country=${location.country.toLowerCase()}`)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={location.image || "/placeholder.svg"}
                        alt={location.country}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge className="bg-primary/90 hover:bg-primary">{location.country}</Badge>
                            <div className="mt-1 text-sm">{location.properties} properties</div>
                          </div>
                          <div className="flex items-center text-sm">
                            <Eye className="mr-1 h-4 w-4" />
                            {location.views}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/real-estate?country=${location.country.toLowerCase()}`)
                        }}
                      >
                        Explore properties
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filter Properties
            </DialogTitle>
            <DialogDescription>Set filters to find properties that match your criteria.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="City, region, or country" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPrice">Min Price</Label>
                <Input id="minPrice" type="number" placeholder="€0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPrice">Max Price</Label>
                <Input id="maxPrice" type="number" placeholder="€1,000,000" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" type="number" placeholder="Any" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input id="bathrooms" type="number" placeholder="Any" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area (m²)</Label>
                <Input id="area" type="number" placeholder="Any" min="0" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Property Type</Label>
              <div className="flex flex-wrap gap-2">
                {["Any", "House", "Apartment", "Villa", "Land", "Commercial"].map((type) => (
                  <Button
                    key={type}
                    variant={type === "Any" ? "default" : "outline"}
                    size="sm"
                    className={type === "Any" ? "bg-primary text-primary-foreground" : ""}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>
              Reset
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                toast({
                  title: "Filters applied",
                  description: "Your property filters have been applied",
                })
                setFilterDialogOpen(false)
                router.push("/real-estate")
              }}
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sort Dialog */}
      <Dialog open={sortDialogOpen} onOpenChange={setSortDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Sort Properties</DialogTitle>
            <DialogDescription>Choose how to sort the property listings.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {[
              { id: "newest", label: "Newest first" },
              { id: "price-asc", label: "Price: Low to High" },
              { id: "price-desc", label: "Price: High to Low" },
              { id: "popular", label: "Most popular" },
              { id: "views", label: "Most viewed" },
            ].map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={option.id}
                  name="sort"
                  className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  defaultChecked={option.id === "newest"}
                />
                <Label htmlFor={option.id}>{option.label}</Label>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSortDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                toast({
                  title: "Sort applied",
                  description: "Properties are now sorted by newest first",
                })
                setSortDialogOpen(false)
              }}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {selectedAgent ? `Message ${agents.find((a) => a.id === selectedAgent)?.name}` : "Inquire About Property"}
            </DialogTitle>
            <DialogDescription>
              {selectedAgent
                ? "Send a message to this agent about their services."
                : "Send an inquiry about this property to the listing agent."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                rows={5}
                placeholder={
                  selectedAgent
                    ? "Hi, I'm interested in your real estate services..."
                    : "Hi, I'm interested in this property and would like more information..."
                }
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMessageDialogOpen(false)
                setMessageText("")
                setSelectedAgent(null)
                setSelectedProperty(null)
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
  )
}
