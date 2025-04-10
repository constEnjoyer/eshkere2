"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  MapPin,
  Bed,
  Bath,
  SquareIcon,
  MoreHorizontal,
  Heart,
  MessageSquare,
  Share2,
  Filter,
  Search,
  Sliders,
  Plus,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NewListingModal } from "@/components/new-listing-modal"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

export default function RealEstatePage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([50000, 500000])
  const [sizeRange, setSizeRange] = useState([30, 200])
  const [newListingOpen, setNewListingOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [propertyType, setPropertyType] = useState("any")
  const [bedroomsFilter, setBedroomsFilter] = useState("Any")
  const [bathroomsFilter, setBathroomsFilter] = useState("Any")
  const [sortOption, setSortOption] = useState("newest")

  // Default properties
  const defaultProperties = [
    {
      id: "villa1",
      title: "Villa in first line of the beach",
      location: "Torrevieja Spain",
      address: "Calle Finlandia 10 3ºB Torrevieja 03183",
      price: "350.000€",
      beds: 2,
      baths: 2,
      size: "90m²",
      seller: {
        name: "Yana Baskaf",
        phone: "+34 677 130 650",
        email: "Yana@gmail.com",
      },
      createdAt: new Date("2023-01-15").getTime(),
    },
    {
      id: "house1",
      title: "Beautiful house with big plot and private parking",
      location: "Rivne Ukraine",
      address: "Vylucia Rivnenska 33000",
      price: "330.000€",
      beds: 3,
      baths: 3,
      size: "150m²",
      seller: {
        name: "Andriy Probenyuk",
        phone: "+34 677 130 650",
        email: "Drobenyuk@gmail.com",
      },
      createdAt: new Date("2023-02-20").getTime(),
    },
    {
      id: "apt1",
      title: "Apartment in center of the city",
      location: "Valencia, Spain",
      address: "Calle Ucrania 10 Valencia 46070",
      price: "250.000€",
      beds: 2,
      baths: 1,
      size: "70m²",
      seller: {
        name: "Dmytro Khytkyy",
        phone: "+34 677 130 650",
        email: "Dmytro@gmail.com",
      },
      createdAt: new Date("2023-03-10").getTime(),
    },
  ]

  const [properties, setProperties] = useState(defaultProperties)
  const [filteredProperties, setFilteredProperties] = useState(defaultProperties)

  // Load properties from localStorage on component mount
  useEffect(() => {
    try {
      const savedProperties = JSON.parse(localStorage.getItem("realEstateListings") || "[]")
      if (savedProperties.length > 0) {
        const allProperties = [...defaultProperties, ...savedProperties]
        setProperties(allProperties)
        setFilteredProperties(allProperties)
      }
    } catch (error) {
      console.error("Error loading properties from localStorage:", error)
    }
  }, [])

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters()
  }, [searchQuery, propertyType, bedroomsFilter, bathroomsFilter, priceRange, sizeRange, sortOption])

  const toggleFavorite = (id: string) => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save favorites",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    let newFavorites = [...favorites]

    if (favorites.includes(id)) {
      newFavorites = favorites.filter((item) => item !== id)
      toast({
        title: "Removed from favorites",
        description: "Property has been removed from your favorites",
      })
    } else {
      newFavorites = [...favorites, id]
      toast({
        title: "Added to favorites",
        description: "Property has been added to your favorites",
      })
    }

    // Update state
    setFavorites(newFavorites)

    // Save to localStorage
    try {
      localStorage.setItem(`favorites-${user.id}`, JSON.stringify(newFavorites))
    } catch (error) {
      console.error("Error saving favorites:", error)
    }
  }

  // Add useEffect to load favorites from localStorage on component mount:
  useEffect(() => {
    if (user) {
      try {
        const savedFavorites = JSON.parse(localStorage.getItem(`favorites-${user.id}`) || "[]")
        setFavorites(savedFavorites)
      } catch (error) {
        console.error("Error loading favorites from localStorage:", error)
      }
    }
  }, [user])

  const applyFilters = () => {
    let filtered = [...properties]

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(query) ||
          property.location.toLowerCase().includes(query) ||
          property.address.toLowerCase().includes(query),
      )
    }

    // Apply property type filter
    if (propertyType !== "any") {
      filtered = filtered.filter((property) => {
        // This is a simplified example. In a real app, you'd have a property type field
        if (propertyType === "apartment") return property.title.toLowerCase().includes("apartment")
        if (propertyType === "house") return property.title.toLowerCase().includes("house")
        if (propertyType === "villa") return property.title.toLowerCase().includes("villa")
        if (propertyType === "bungalow") return property.title.toLowerCase().includes("bungalow")
        if (propertyType === "townhouse") return property.title.toLowerCase().includes("townhouse")
        return true
      })
    }

    // Apply bedrooms filter
    if (bedroomsFilter !== "Any") {
      const minBeds = Number.parseInt(bedroomsFilter.replace("+", ""))
      filtered = filtered.filter((property) => property.beds >= minBeds)
    }

    // Apply bathrooms filter
    if (bathroomsFilter !== "Any") {
      const minBaths = Number.parseInt(bathroomsFilter.replace("+", ""))
      filtered = filtered.filter((property) => property.baths >= minBaths)
    }

    // Apply price range filter
    filtered = filtered.filter((property) => {
      const price = Number.parseInt(property.price.replace(/[^0-9]/g, ""))
      return price >= priceRange[0] && price <= priceRange[1]
    })

    // Apply size range filter
    filtered = filtered.filter((property) => {
      const size = Number.parseInt(property.size.replace(/[^0-9]/g, ""))
      return size >= sizeRange[0] && size <= sizeRange[1]
    })

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortOption === "newest") {
        return (b.createdAt || 0) - (a.createdAt || 0)
      } else if (sortOption === "price-asc") {
        const priceA = Number.parseInt(a.price.replace(/[^0-9]/g, ""))
        const priceB = Number.parseInt(b.price.replace(/[^0-9]/g, ""))
        return priceA - priceB
      } else if (sortOption === "price-desc") {
        const priceA = Number.parseInt(a.price.replace(/[^0-9]/g, ""))
        const priceB = Number.parseInt(b.price.replace(/[^0-9]/g, ""))
        return priceB - priceA
      }
      return 0
    })

    setFilteredProperties(filtered)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setPropertyType("any")
    setBedroomsFilter("Any")
    setBathroomsFilter("Any")
    setPriceRange([50000, 500000])
    setSizeRange([30, 200])
    setSortOption("newest")

    toast({
      title: "Filters reset",
      description: "All filters have been reset to default values",
    })
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Left Sidebar - Filters */}
        <div className="space-y-8">
          <div>
            <Button className="w-full bg-primary text-white hover:bg-primary/90">
              <MapPin className="mr-2 h-4 w-4" />
              Map search
            </Button>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">FILTERS</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary"
                onClick={resetFilters}
              >
                Reset all
              </Button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search properties..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-medium">Property Type</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className={`flex h-auto flex-col gap-1 p-3 ${propertyType === "apartment" ? "border-primary bg-primary/5" : "hover:border-primary hover:bg-primary/5"}`}
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
                    <span className="text-xs">Condo</span>
                  </Button>

                  <Button
                    variant="outline"
                    className={`flex h-auto flex-col gap-1 p-3 ${propertyType === "house" ? "border-primary bg-primary/5" : "hover:border-primary hover:bg-primary/5"}`}
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
                    <span className="text-xs">House</span>
                  </Button>

                  <Button
                    variant="outline"
                    className={`flex h-auto flex-col gap-1 p-3 ${propertyType === "villa" ? "border-primary bg-primary/5" : "hover:border-primary hover:bg-primary/5"}`}
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
                    <span className="text-xs">Villa</span>
                  </Button>
                </div>

                <Select
                  value={propertyType === "any" ? "bungalow" : propertyType}
                  onValueChange={(value) => setPropertyType(value)}
                >
                  <SelectTrigger className="mt-3 w-full">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bungalow">Bungalow</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium">Price Range</h3>
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
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
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
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                      EUR
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-medium">Bedrooms</h3>
                <div className="flex flex-wrap gap-2">
                  {["Any", "1+", "2+", "3+", "4+", "5+"].map((option) => (
                    <Button
                      key={option}
                      variant={option === bedroomsFilter ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 min-w-[60px] ${option === bedroomsFilter ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:border-primary hover:bg-primary/5"}`}
                      onClick={() => setBedroomsFilter(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-medium">Bathrooms</h3>
                <div className="flex flex-wrap gap-2">
                  {["Any", "1+", "2+", "3+", "4+"].map((option) => (
                    <Button
                      key={option}
                      variant={option === bathroomsFilter ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 min-w-[60px] ${option === bathroomsFilter ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:border-primary hover:bg-primary/5"}`}
                      onClick={() => setBathroomsFilter(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium">Size Range</h3>
                  <span className="text-sm text-muted-foreground">
                    {sizeRange[0]} - {sizeRange[1]} m²
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
                      onChange={(e) => setSizeRange([Number(e.target.value), sizeRange[1]])}
                      className="pr-8"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                      m²
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={sizeRange[1]}
                      onChange={(e) => setSizeRange([sizeRange[0], Number(e.target.value)])}
                      className="pr-8"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                      m²
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button className="w-full bg-primary text-white hover:bg-primary/90" onClick={applyFilters}>
                  <Filter className="mr-2 h-4 w-4" />
                  Apply filters
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Listings */}
        <div className="lg:col-span-3">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold">
              REAL ESTATE LISTING{" "}
              <Badge className="ml-2 bg-primary/90 hover:bg-primary">
                {filteredProperties.length} of {properties.length}
              </Badge>
            </h1>
            <div className="flex items-center gap-2">
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most popular</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Sliders className="h-4 w-4" />
              </Button>
              <Button
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => {
                  if (!user) {
                    toast({
                      title: "Authentication required",
                      description: "Please log in to create a listing",
                      variant: "destructive",
                    })
                    router.push("/login")
                    return
                  }
                  setNewListingOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Listing
              </Button>
            </div>
          </div>

          {filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No properties found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
              <Button className="mt-4" variant="outline" onClick={resetFilters}>
                Reset all filters
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredProperties.map((property) => (
                <div key={property.id}>
                  <Card className="overflow-hidden group hover:border-primary/50 hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative h-64 w-full md:h-auto md:w-2/5">
                        <div className="absolute left-3 top-3 rounded-md bg-black/20 backdrop-blur-sm px-2 py-1 text-xs text-white">
                          Last viewing 90 min
                        </div>
                        <Image
                          src={`/placeholder.svg?height=300&width=400`}
                          alt={property.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-3 right-3 flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-white/90 hover:bg-white"
                            onClick={() => toggleFavorite(property.id)}
                          >
                            <Heart
                              className={`h-4 w-4 ${favorites.includes(property.id) ? "fill-primary text-primary" : "text-gray-700"}`}
                            />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white">
                            <Share2 className="h-4 w-4 text-gray-700" />
                          </Button>
                        </div>
                        <div className="absolute bottom-3 right-3 flex -space-x-2">
                          {[1, 2, 3].map((i) => (
                            <Avatar key={i} className="h-8 w-8 border-2 border-white">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                U{i}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-xs text-white">
                            +1
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <Link href={`/real-estate/${property.id}`}>
                              <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
                                {property.title}
                              </h2>
                            </Link>
                            <div className="mt-1 flex items-center text-sm text-muted-foreground">
                              <MapPin className="mr-1 h-4 w-4 text-primary" />
                              {property.location} • {property.address}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleFavorite(property.id)}>
                                <Heart className="mr-2 h-4 w-4" />
                                {favorites.includes(property.id) ? "Remove from favorites" : "Add to favorites"}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Contact agent
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="mr-2 h-4 w-4" />
                                Share listing
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
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
                                  className="mr-2 h-4 w-4"
                                >
                                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                                </svg>
                                Save for later
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-4">
                          <Badge variant="outline" className="flex items-center gap-1 bg-primary/5">
                            <Bed className="h-3 w-3 text-primary" />
                            {property.beds} bed
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1 bg-primary/5">
                            <Bath className="h-3 w-3 text-primary" />
                            {property.baths} bath
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1 bg-primary/5">
                            <SquareIcon className="h-3 w-3 text-primary" />
                            {property.size}
                          </Badge>
                        </div>

                        <div className="mt-auto flex items-end justify-between pt-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-primary/10">
                              <AvatarImage src={`/placeholder.svg?height=40&width=40`} alt={property.seller.name} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {property.seller.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {property.seller.name}{" "}
                                <Badge variant="outline" className="ml-1">
                                  seller
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{property.seller.phone}</span>
                                <span>•</span>
                                <span>{property.seller.email}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{property.price}</div>
                            <div className="mt-2 flex gap-2">
                              <Button size="sm" className="bg-primary hover:bg-primary/90">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Contact
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/real-estate/${property.id}`}>View</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}

          {filteredProperties.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                className="gap-1"
                onClick={() =>
                  toast({
                    title: "Loading more properties",
                    description: "Additional properties are being loaded",
                  })
                }
              >
                Load more properties
                <Badge className="ml-1 bg-primary/90 hover:bg-primary">
                  {properties.length - filteredProperties.length}
                </Badge>
              </Button>
            </div>
          )}
        </div>
      </div>

      <NewListingModal open={newListingOpen} onOpenChange={setNewListingOpen} />
    </div>
  )
}
