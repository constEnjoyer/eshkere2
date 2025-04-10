"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Star,
  Plus,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  Edit,
  Trash,
  Heart,
  Share2,
  MessageSquare,
  Upload,
  UserPlus,
} from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ProfilePage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const [activeTab, setActiveTab] = useState(tabParam || "about-company")
  const [favorites, setFavorites] = useState<string[]>([])
  const [editExperienceOpen, setEditExperienceOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [deleteExperienceOpen, setDeleteExperienceOpen] = useState(false)
  const [deleteListingOpen, setDeleteListingOpen] = useState(false)
  const [deleteServiceOpen, setDeleteServiceOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [messageText, setMessageText] = useState("")

  // Initialize experiences
  const [experiences, setExperiences] = useState([
    {
      id: "exp1",
      position: "Sole trader as a real estate agent",
      company: "Self Employed",
      location: "Around the world",
      startDate: "Jun 2016",
      endDate: "Present",
      description:
        "Work with clients and web studios as freelancer. Work in next areas: eCommerce web projects; creative landing pages; iOS and Android apps; corporate web sites and corporate identity sometimes.",
    },
  ])

  // Initialize listings
  const [listings, setListings] = useState([
    {
      id: "villa1",
      title: "Villa in first line of the beach",
      location: "Torrevieja Spain",
      date: "15.07.2023",
    },
    {
      id: "house1",
      title: "Beautiful house with big plot and private",
      location: "Rivne Ukraine",
      date: "15.07.2023",
    },
    {
      id: "apt1",
      title: "Apartment in center of the city",
      location: "Valencia, Spain",
      date: "15.07.2023",
    },
  ])

  // Initialize services
  const [services, setServices] = useState([
    {
      id: "sofa1",
      title: "Sofa for sell in good condition",
      location: "Torrevieja Spain",
      date: "15.07.2023",
    },
    {
      id: "nie1",
      title: "N.I.E. number for foreign",
      location: "Torrevieja Spain",
      date: "15.07.2023",
    },
    {
      id: "home1",
      title: "Home standing service",
      location: "Torrevieja Spain",
      date: "15.07.2023",
    },
  ])

  // Form data for experience
  const [experienceForm, setExperienceForm] = useState({
    id: "",
    position: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
  })

  // Form data for profile
  const [profileForm, setProfileForm] = useState({
    firstName: "Ruben",
    lastName: "Bothman",
    email: "ruben.bothman@gmail.com",
    phone: "+34 677 130 650",
    bio: "I've heard the argument that 'lorem ipsum' is effective in wireframing or design because it helps people focus on the actual layout, or color scheme, or whatever.",
  })

  // Effect to sync tab from URL
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

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

  const handleEditExperience = (experience?: (typeof experiences)[0]) => {
    if (experience) {
      setExperienceForm({
        id: experience.id,
        position: experience.position,
        company: experience.company,
        location: experience.location,
        startDate: experience.startDate,
        endDate: experience.endDate,
        description: experience.description,
      })
    } else {
      setExperienceForm({
        id: `exp${Date.now()}`,
        position: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
      })
    }
    setEditExperienceOpen(true)
  }

  const handleSaveExperience = () => {
    // Validate form
    if (!experienceForm.position || !experienceForm.company) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Check if editing or adding
    if (experiences.some((exp) => exp.id === experienceForm.id)) {
      // Update existing
      setExperiences(experiences.map((exp) => (exp.id === experienceForm.id ? experienceForm : exp)))
      toast({
        title: "Experience updated",
        description: "Your experience has been updated successfully",
      })
    } else {
      // Add new
      setExperiences([...experiences, experienceForm])
      toast({
        title: "Experience added",
        description: "Your new experience has been added successfully",
      })
    }

    setEditExperienceOpen(false)
  }

  const handleDeleteExperience = () => {
    if (!selectedItemId) return

    setExperiences(experiences.filter((exp) => exp.id !== selectedItemId))
    setDeleteExperienceOpen(false)
    setSelectedItemId(null)

    toast({
      title: "Experience deleted",
      description: "The experience entry has been removed",
    })
  }

  const handleDeleteListing = () => {
    if (!selectedItemId) return

    setListings(listings.filter((listing) => listing.id !== selectedItemId))
    setDeleteListingOpen(false)
    setSelectedItemId(null)

    toast({
      title: "Listing deleted",
      description: "The property listing has been removed",
    })
  }

  const handleDeleteService = () => {
    if (!selectedItemId) return

    setServices(services.filter((service) => service.id !== selectedItemId))
    setDeleteServiceOpen(false)
    setSelectedItemId(null)

    toast({
      title: "Service deleted",
      description: "The service has been removed",
    })
  }

  const handleSaveProfile = () => {
    // Validate form
    if (!profileForm.firstName || !profileForm.lastName || !profileForm.email) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    })

    setEditProfileOpen(false)
  }

  const handleShareProfile = () => {
    navigator.clipboard.writeText("https://realestatepro.com/profile/ruben-bothman")

    toast({
      title: "Profile shared",
      description: "Profile link has been copied to clipboard",
    })

    setShareDialogOpen(false)
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
      description: "Your message has been sent to Ruben Bothman",
    })

    setMessageText("")
    setMessageDialogOpen(false)
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
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Ruben Bothman" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">RB</AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-white hover:bg-primary/90"
                  onClick={() => setEditProfileOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4">
                <h2 className="text-xl font-bold">Ruben Bothman</h2>
                <p className="text-sm text-muted-foreground">Real estate agent</p>
                <div className="mt-2 flex items-center justify-center">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="ml-1 text-sm font-medium">5.0</span>
                  <span className="ml-1 text-xs text-muted-foreground">(124 reviews)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Events
                </span>
                <Badge variant="outline" className="bg-primary/5">
                  456
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-primary" />
                  Properties
                </span>
                <Badge variant="outline" className="bg-primary/5">
                  602
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Followers
                </span>
                <Badge variant="outline" className="bg-primary/5">
                  290
                </Badge>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => setMessageDialogOpen(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setShareDialogOpen(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900"
          >
            <h3 className="font-medium mb-4">Quick Links</h3>
            <nav className="space-y-1">
              <Link
                href="/real-estate?filter=sellers"
                className="flex items-center gap-2 rounded-md p-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
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
                  className="h-5 w-5"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
                Looking for sellers
              </Link>
              <Link
                href="/marketing"
                className="flex items-center gap-2 rounded-md p-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
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
                  className="h-5 w-5"
                >
                  <path d="M17 6.1H3" />
                  <path d="M21 12.1H3" />
                  <path d="M15.1 18H3" />
                </svg>
                Digital marketing
              </Link>
              <Link
                href="/calendar"
                className="flex items-center gap-2 rounded-md p-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
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
                  className="h-5 w-5"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M8 3v18" />
                  <path d="M16 3v18" />
                  <path d="M3 8h18" />
                  <path d="M3 16h18" />
                </svg>
                Calendar
              </Link>
              <Link
                href="/customers"
                className="flex items-center gap-2 rounded-md p-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
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
                  className="h-5 w-5"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Customers
              </Link>
            </nav>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 rounded-xl border bg-white shadow-sm dark:bg-gray-900"
          >
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
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
                <TabsTrigger
                  value="listing-services"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                >
                  LISTING AND SERVICES
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about-company" className="p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-primary">ABOUT</h2>
                    <div className="mt-4 rounded-lg border p-4 bg-muted/30">
                      <p className="text-muted-foreground">
                        "I've heard the argument that "lorem ipsum" is effective in wireframing or design because it
                        helps people focus on the actual layout, or color scheme, or whatever. What kills me here is
                        that we're talking about creating a user experience that will (whether we like it or not) be
                        DRIVEN by words. The entire structure of the page or app flow is FOR THE WORDS."
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="mt-2 p-0 text-primary">
                            Read more
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>About Ruben Bothman</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>
                              "I've heard the argument that "lorem ipsum" is effective in wireframing or design because
                              it helps people focus on the actual layout, or color scheme, or whatever. What kills me
                              here is that we're talking about creating a user experience that will (whether we like it
                              or not) be DRIVEN by words. The entire structure of the page or app flow is FOR THE
                              WORDS."
                            </p>
                            <p>
                              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
                              ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                              ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
                              reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
                            </p>
                            <p>
                              "With over 10 years of experience in real estate, I've helped hundreds of clients find
                              their dream homes and make smart investment decisions. My approach combines deep market
                              knowledge with personalized service to ensure every client gets exactly what they need."
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-primary">SKILLS</h2>

                    <div className="mt-4 grid gap-6 md:grid-cols-3">
                      <div className="rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">LANGUAGES</span>
                          <Badge className="bg-primary/90 hover:bg-primary">6</Badge>
                        </div>
                        <div className="mt-4 flex -space-x-2">
                          {[1, 2, 3, 4].map((i) => (
                            <Avatar key={i} className="h-8 w-8 border-2 border-white">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">L{i}</AvatarFallback>
                            </Avatar>
                          ))}
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-xs text-white">
                            +4
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">BUSINESS KNOWLEDGE</span>
                          <Badge className="bg-primary/90 hover:bg-primary">6</Badge>
                        </div>
                        <div className="mt-4 flex -space-x-2">
                          {[1, 2, 3, 4].map((i) => (
                            <Avatar key={i} className="h-8 w-8 border-2 border-white">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">B{i}</AvatarFallback>
                            </Avatar>
                          ))}
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-xs text-white">
                            +4
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">SERVICES-BUSINESS PROCESS</span>
                          <Badge className="bg-primary/90 hover:bg-primary">6</Badge>
                        </div>
                        <div className="mt-4 flex -space-x-2">
                          {[1, 2, 3].map((i) => (
                            <Avatar key={i} className="h-8 w-8 border-2 border-white">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">S{i}</AvatarFallback>
                            </Avatar>
                          ))}
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-xs text-white">
                            +4
                          </div>
                        </div>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="mt-4 flex justify-end">
                          <Button variant="outline" size="sm" className="gap-1">
                            SHOW ALL <Badge className="ml-1 bg-primary/90 hover:bg-primary">12</Badge>
                          </Button>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>All Skills</DialogTitle>
                          <DialogDescription>Complete list of professional skills and competencies</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4 md:grid-cols-2">
                          <div className="rounded-lg border p-4">
                            <h3 className="font-medium text-primary mb-2">LANGUAGES</h3>
                            <ul className="space-y-2">
                              <li className="flex items-center justify-between">
                                <span>English</span>
                                <Badge>Fluent</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Spanish</span>
                                <Badge>Fluent</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>French</span>
                                <Badge>Intermediate</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>German</span>
                                <Badge>Basic</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Italian</span>
                                <Badge>Basic</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Portuguese</span>
                                <Badge>Basic</Badge>
                              </li>
                            </ul>
                          </div>

                          <div className="rounded-lg border p-4">
                            <h3 className="font-medium text-primary mb-2">BUSINESS KNOWLEDGE</h3>
                            <ul className="space-y-2">
                              <li className="flex items-center justify-between">
                                <span>Property Valuation</span>
                                <Badge>Expert</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Market Analysis</span>
                                <Badge>Expert</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Contract Negotiation</span>
                                <Badge>Expert</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Investment Strategy</span>
                                <Badge>Advanced</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Property Law</span>
                                <Badge>Intermediate</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Tax Planning</span>
                                <Badge>Intermediate</Badge>
                              </li>
                            </ul>
                          </div>

                          <div className="rounded-lg border p-4">
                            <h3 className="font-medium text-primary mb-2">SERVICES-BUSINESS PROCESS</h3>
                            <ul className="space-y-2">
                              <li className="flex items-center justify-between">
                                <span>Client Management</span>
                                <Badge>Expert</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Marketing</span>
                                <Badge>Advanced</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Digital Presence</span>
                                <Badge>Advanced</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Process Optimization</span>
                                <Badge>Intermediate</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Team Leadership</span>
                                <Badge>Advanced</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Project Management</span>
                                <Badge>Advanced</Badge>
                              </li>
                            </ul>
                          </div>

                          <div className="rounded-lg border p-4">
                            <h3 className="font-medium text-primary mb-2">TECHNICAL SKILLS</h3>
                            <ul className="space-y-2">
                              <li className="flex items-center justify-between">
                                <span>CRM Systems</span>
                                <Badge>Expert</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Property Databases</span>
                                <Badge>Expert</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Digital Marketing Tools</span>
                                <Badge>Advanced</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Virtual Tours</span>
                                <Badge>Intermediate</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Photography</span>
                                <Badge>Intermediate</Badge>
                              </li>
                              <li className="flex items-center justify-between">
                                <span>Video Editing</span>
                                <Badge>Basic</Badge>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="agent-info" className="p-6">
                <h2 className="text-xl font-bold">Agent Information</h2>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-sm">
                    <h3 className="flex items-center gap-2 font-medium">
                      <Users className="h-5 w-5 text-primary" />
                      Contact Details
                    </h3>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5">
                          Email
                        </Badge>
                        <span className="text-sm">ruben.bothman@gmail.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5">
                          Phone
                        </Badge>
                        <span className="text-sm">+34 677 130 650</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5">
                          Office
                        </Badge>
                        <span className="text-sm">Torrevieja, Spain</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-sm">
                    <h3 className="flex items-center gap-2 font-medium">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Specializations
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Luxury Properties</Badge>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Beachfront</Badge>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Investment</Badge>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Commercial</Badge>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Residential</Badge>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">International</Badge>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-sm">
                    <h3 className="flex items-center gap-2 font-medium">
                      <MapPin className="h-5 w-5 text-primary" />
                      Service Areas
                    </h3>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Torrevieja</span>
                        <Badge variant="outline">Primary</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Alicante</span>
                        <Badge variant="outline">Secondary</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Valencia</span>
                        <Badge variant="outline">Secondary</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-sm">
                    <h3 className="flex items-center gap-2 font-medium">
                      <Calendar className="h-5 w-5 text-primary" />
                      Availability
                    </h3>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Monday - Friday</span>
                        <span className="text-sm font-medium">9:00 - 18:00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Saturday</span>
                        <span className="text-sm font-medium">10:00 - 15:00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sunday</span>
                        <span className="text-sm font-medium">By appointment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="listing-services" className="p-6">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-lg font-semibold text-primary">
                    REAL ESTATE LISTING <span className="text-muted-foreground">3 of 12</span>
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      window.location.href = "/real-estate?owner=ruben-bothman"
                    }}
                  >
                    SHOW ALL <Badge className="ml-1 bg-primary/90 hover:bg-primary">12</Badge>
                  </Button>
                </div>

                <motion.div variants={container} initial="hidden" animate="show" className="grid gap-6 md:grid-cols-3">
                  {listings.map((listing) => (
                    <motion.div key={listing.id} variants={item}>
                      <div className="group overflow-hidden rounded-lg border bg-white transition-all hover:border-primary/50 hover:shadow-md dark:bg-gray-900">
                        <div className="relative h-48">
                          <Image
                            src={`/placeholder.svg?height=200&width=300`}
                            alt={listing.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-white/90 hover:bg-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(listing.id)
                              }}
                            >
                              <Heart
                                className={`h-4 w-4 ${favorites.includes(listing.id) ? "fill-primary text-primary" : "text-gray-700"}`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-white/90 hover:bg-white"
                              onClick={() => {
                                window.location.href = `/real-estate/edit/${listing.id}`
                              }}
                            >
                              <Edit className="h-4 w-4 text-gray-700" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-white/90 hover:bg-white"
                              onClick={() => {
                                setSelectedItemId(listing.id)
                                setDeleteListingOpen(true)
                              }}
                            >
                              <Trash className="h-4 w-4 text-gray-700" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium group-hover:text-primary transition-colors">{listing.title}</h3>
                          <div className="mt-2 flex items-center text-sm text-muted-foreground">
                            <MapPin className="mr-1 h-4 w-4" />
                            {listing.location}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-4 w-4" />
                            {listing.date}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                              onClick={() => {
                                window.location.href = `/real-estate/${listing.id}`
                              }}
                            >
                              View details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <div className="mt-10 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-lg font-semibold text-primary">
                    SHOP AND SERVICES <span className="text-muted-foreground">3 of 12</span>
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      window.location.href = "/services/new"
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add new service
                  </Button>
                </div>

                <motion.div variants={container} initial="hidden" animate="show" className="grid gap-6 md:grid-cols-3">
                  {services.map((service) => (
                    <motion.div key={service.id} variants={item}>
                      <div className="group overflow-hidden rounded-lg border bg-white transition-all hover:border-primary/50 hover:shadow-md dark:bg-gray-900">
                        <div className="relative h-48">
                          <Image
                            src={`/placeholder.svg?height=200&width=300`}
                            alt={service.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-white/90 hover:bg-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(service.id)
                              }}
                            >
                              <Heart
                                className={`h-4 w-4 ${favorites.includes(service.id) ? "fill-primary text-primary" : "text-gray-700"}`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-white/90 hover:bg-white"
                              onClick={() => {
                                window.location.href = `/services/edit/${service.id}`
                              }}
                            >
                              <Edit className="h-4 w-4 text-gray-700" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-white/90 hover:bg-white"
                              onClick={() => {
                                setSelectedItemId(service.id)
                                setDeleteServiceOpen(true)
                              }}
                            >
                              <Trash className="h-4 w-4 text-gray-700" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium group-hover:text-primary transition-colors">{service.title}</h3>
                          <div className="mt-2 flex items-center text-sm text-muted-foreground">
                            <MapPin className="mr-1 h-4 w-4" />
                            {service.location}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-4 w-4" />
                            {service.date}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                              onClick={() => {
                                window.location.href = `/services/${service.id}`
                              }}
                            >
                              View details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">EXPERIENCE</h2>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleEditExperience()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {experiences.map((experience) => (
                <div key={experience.id} className="flex gap-4">
                  <div className="flex-shrink-0 rounded-md bg-primary p-3">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium">{experience.position}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
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
                          className="h-4 w-4"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        {experience.company}
                      </div>
                      <div className="flex items-center gap-1">
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
                          className="h-4 w-4"
                        >
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {experience.location}
                      </div>
                      <div className="flex items-center gap-1">
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
                          className="h-4 w-4"
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <path d="M3 9h18" />
                          <path d="M9 21V9" />
                        </svg>
                        {experience.startDate} — {experience.endDate}
                      </div>
                    </div>
                    <p className="mt-3 text-sm">{experience.description}</p>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditExperience(experience)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedItemId(experience.id)
                          setDeleteExperienceOpen(true)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full" onClick={() => handleEditExperience()}>
                <Plus className="mr-2 h-4 w-4" />
                Add more experience
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Edit Profile
            </DialogTitle>
            <DialogDescription>Update your personal information and profile settings.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Profile" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">RB</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Open file picker
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = "image/*"
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      toast({
                        title: "Photo uploaded",
                        description: "Your profile photo has been updated",
                      })
                    }
                  }
                  input.click()
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload new photo
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveProfile}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Experience Dialog */}
      <Dialog open={editExperienceOpen} onOpenChange={setEditExperienceOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              {experienceForm.id ? "Edit Experience" : "Add Experience"}
            </DialogTitle>
            <DialogDescription>
              {experienceForm.id ? "Update your professional experience." : "Add a new professional experience."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={experienceForm.position}
                onChange={(e) => setExperienceForm({ ...experienceForm, position: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={experienceForm.company}
                onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  value={experienceForm.startDate}
                  onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })}
                  placeholder="e.g. Jun 2016"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  value={experienceForm.endDate}
                  onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })}
                  placeholder="e.g. Present"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={experienceForm.location}
                onChange={(e) => setExperienceForm({ ...experienceForm, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={experienceForm.description}
                onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditExperienceOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveExperience}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
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
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value="https://realestatepro.com/profile/ruben-bothman"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button variant="outline" size="icon" onClick={handleShareProfile}>
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
                    className="h-4 w-4"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c0-2.2 1.8-4 4-4" />
                    <path d="M4 12c0-2.2 1.8-4 4-4" />
                    <path d="M8 4h12" />
                    <path d="M16 4v4" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Share on Social Media</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.open(
                      "https://twitter.com/intent/tweet?url=https://realestatepro.com/profile/ruben-bothman",
                      "_blank",
                    )
                    toast({
                      title: "Shared on Twitter",
                      description: "Your profile has been shared on Twitter",
                    })
                  }}
                >
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.open(
                      "https://www.facebook.com/sharer/sharer.php?u=https://realestatepro.com/profile/ruben-bothman",
                      "_blank",
                    )
                    toast({
                      title: "Shared on Facebook",
                      description: "Your profile has been shared on Facebook",
                    })
                  }}
                >
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.open(
                      "https://www.linkedin.com/shareArticle?mini=true&url=https://realestatepro.com/profile/ruben-bothman",
                      "_blank",
                    )
                    toast({
                      title: "Shared on LinkedIn",
                      description: "Your profile has been shared on LinkedIn",
                    })
                  }}
                >
                  LinkedIn
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Message Ruben Bothman
            </DialogTitle>
            <DialogDescription>Send a message to Ruben Bothman.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                rows={5}
                placeholder="Hi Ruben, I'm interested in your real estate services..."
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

      {/* Delete Experience Alert */}
      <AlertDialog open={deleteExperienceOpen} onOpenChange={setDeleteExperienceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this experience entry from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteExperienceOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExperience}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Listing Alert */}
      <AlertDialog open={deleteListingOpen} onOpenChange={setDeleteListingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this property listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteListingOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteListing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Service Alert */}
      <AlertDialog open={deleteServiceOpen} onOpenChange={setDeleteServiceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this service.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteServiceOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
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
  )
}
