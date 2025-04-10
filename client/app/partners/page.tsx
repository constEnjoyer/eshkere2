"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Plus, X, UserPlus, Building, Users } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"

export default function PartnersPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [partners, setPartners] = useState([
    {
      id: "1",
      name: "Theresa Steward",
      role: "Real estate agent",
      avatar: "/placeholder.svg?height=64&width=64",
    },
    {
      id: "2",
      name: "Idealista",
      role: "Real estate listing",
      avatar: "/placeholder.svg?height=64&width=64",
      bgColor: "bg-lime-200",
    },
    {
      id: "3",
      name: "Drumella Real Estate",
      role: "Developer company",
      avatar: "/placeholder.svg?height=64&width=64",
      initial: "D",
      bgColor: "bg-amber-100",
    },
    {
      id: "4",
      name: "Engel & Völkers España",
      role: "Real estate manager",
      avatar: "/placeholder.svg?height=64&width=64",
    },
    {
      id: "5",
      name: "Felice Tufano",
      role: "Real estate manager",
      avatar: "/placeholder.svg?height=64&width=64",
    },
    {
      id: "6",
      name: "Theresa Steward",
      role: "Real estate company",
      avatar: "/placeholder.svg?height=64&width=64",
    },
  ])

  const handleAddPartner = (partner: any) => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add partners",
        variant: "destructive",
      })
      return
    }

    const newPartner = {
      id: `new-${Date.now()}`,
      name: partner.name,
      role: partner.role || "Real estate agent",
      avatar: partner.avatar || `/placeholder.svg?height=48&width=48&text=${partner.name.charAt(0)}`,
      online: Math.random() > 0.5,
    }

    // Save to localStorage
    try {
      const existingPartners = JSON.parse(localStorage.getItem("partners") || "[]")
      const updatedPartners = [...existingPartners, newPartner]
      localStorage.setItem("partners", JSON.stringify(updatedPartners))

      // Update state
      setPartners([...partners, newPartner])

      toast({
        title: "Partner added",
        description: `${partner.name} has been added to your network`,
      })
    } catch (error) {
      console.error("Error saving partner:", error)
      toast({
        title: "Error adding partner",
        description: "There was a problem adding the partner. Please try again.",
        variant: "destructive",
      })
    }
  }

  const removePartner = (id: string) => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to remove partners",
        variant: "destructive",
      })
      return
    }

    try {
      // Update state
      setPartners(partners.filter((partner) => partner.id !== id))

      // Update localStorage
      const existingPartners = JSON.parse(localStorage.getItem("partners") || "[]")
      const updatedPartners = existingPartners.filter((partner: any) => partner.id !== id)
      localStorage.setItem("partners", JSON.stringify(updatedPartners))

      toast({
        title: "Partner removed",
        description: "The partner has been removed from your network",
      })
    } catch (error) {
      console.error("Error removing partner:", error)
      toast({
        title: "Error removing partner",
        description: "There was a problem removing the partner. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    try {
      const savedPartners = JSON.parse(localStorage.getItem("partners") || "[]")
      if (savedPartners.length > 0) {
        setPartners(savedPartners)
      }
    } catch (error) {
      console.error("Error loading partners from localStorage:", error)
    }
  }, [])

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
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Ruben Bothman" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">RB</AvatarFallback>
              </Avatar>
              <div className="mt-4">
                <h2 className="text-xl font-bold">Ruben Bothman</h2>
                <p className="text-sm text-muted-foreground">Real estate agent</p>
                <div className="mt-2 flex items-center justify-center">
                  <Badge variant="outline" className="bg-primary/5">
                    Premium Partner
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span>Events</span>
                <Badge variant="outline" className="bg-primary/5">
                  456
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Properties</span>
                <Badge variant="outline" className="bg-primary/5">
                  602
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Followers</span>
                <Badge variant="outline" className="bg-primary/5">
                  290
                </Badge>
              </div>
            </div>

            <div className="mt-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add new partner
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add new partner</DialogTitle>
                    <DialogDescription>Search for partners or invite them to join your network.</DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="search">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="search">Search</TabsTrigger>
                      <TabsTrigger value="invite">Invite</TabsTrigger>
                    </TabsList>

                    <TabsContent value="search" className="mt-4 space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="text" placeholder="Search by name or company" className="pl-10" />
                      </div>

                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={`/placeholder.svg?height=40&width=40&text=User${i}`} />
                                <AvatarFallback>U{i}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium">Partner Name {i}</h4>
                                <p className="text-xs text-muted-foreground">Real estate agent</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleAddPartner({
                                  name: `Partner Name ${i}`,
                                  role: "Real estate agent",
                                  avatar: `/placeholder.svg?height=48&width=48&text=User${i}`,
                                })
                              }
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="invite" className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Input type="email" placeholder="Email address" />
                        <Input type="text" placeholder="Name (optional)" />
                        <Input type="text" placeholder="Company (optional)" />
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => {
                          const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
                          const nameInput = document.querySelector(
                            'input[placeholder="Name (optional)"]',
                          ) as HTMLInputElement
                          const companyInput = document.querySelector(
                            'input[placeholder="Company (optional)"]',
                          ) as HTMLInputElement

                          if (emailInput && emailInput.value) {
                            handleAddPartner({
                              name: nameInput?.value || emailInput.value.split("@")[0],
                              role: companyInput?.value ? `${companyInput.value} employee` : "Invited partner",
                              avatar: `/placeholder.svg?height=48&width=48&text=${(nameInput?.value || emailInput.value)[0]}`,
                            })

                            // Clear inputs
                            emailInput.value = ""
                            if (nameInput) nameInput.value = ""
                            if (companyInput) companyInput.value = ""

                            toast({
                              title: "Invitation sent",
                              description: "An invitation has been sent to the email address",
                            })
                          } else {
                            toast({
                              title: "Missing email",
                              description: "Please enter an email address",
                              variant: "destructive",
                            })
                          }
                        }}
                      >
                        Send invitation
                      </Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
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
                href="#"
                className="flex items-center gap-2 rounded-md p-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                onClick={() => {
                  toast({
                    title: "My Network",
                    description: "Navigating to My Network section",
                  })
                }}
              >
                <Users className="h-5 w-5" />
                My Network
              </Link>
              <Link
                href="#"
                className="flex items-center gap-2 rounded-md p-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                onClick={() => {
                  toast({
                    title: "Companies",
                    description: "Navigating to Companies section",
                  })
                }}
              >
                <Building className="h-5 w-5" />
                Companies
              </Link>
              <Link
                href="#"
                className="flex items-center gap-2 rounded-md p-2 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                onClick={() => {
                  toast({
                    title: "Invitations",
                    description: "Navigating to Invitations section",
                  })
                }}
              >
                <UserPlus className="h-5 w-5" />
                Invitations
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
            className="mb-6"
          >
            <h1 className="text-2xl font-bold">PARTNERS</h1>
            <p className="mt-2 text-muted-foreground">Manage your network of partners and collaborators</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900"
          >
            <h2 className="mb-4 text-lg font-semibold text-primary">SEARCH</h2>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="text" placeholder="Name Surname, company" className="pl-10" />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="text" placeholder="Country" className="pl-10" />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="text" placeholder="City" className="pl-10" />
              </div>
            </div>

            <Button className="mt-4 bg-primary text-white hover:bg-primary/90">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </motion.div>

          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {partners.map((partner) => (
              <motion.div key={partner.id} variants={item}>
                <div className="flex items-center justify-between rounded-xl border bg-white p-4 transition-all hover:border-primary/50 hover:shadow-md dark:bg-gray-900">
                  <div className="flex items-center gap-4">
                    <Avatar className={`h-16 w-16 ${partner.bgColor || ""}`}>
                      {partner.initial ? (
                        <AvatarFallback className="text-xl">{partner.initial}</AvatarFallback>
                      ) : (
                        <>
                          <AvatarImage src={partner.avatar} alt={partner.name} />
                          <AvatarFallback>
                            {partner.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-bold">{partner.name}</h3>
                      <p className="text-sm text-muted-foreground">{partner.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-primary/5 hover:border-primary/50"
                      onClick={() =>
                        toast({
                          title: "Contact details",
                          description: "Contact details will be displayed shortly",
                        })
                      }
                    >
                      View details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                      onClick={() => removePartner(partner.id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="ml-1 hidden sm:inline">REMOVE</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              className="gap-1"
              onClick={() =>
                toast({
                  title: "Loading more partners",
                  description: "Additional partners are being loaded",
                })
              }
            >
              <Plus className="h-4 w-4" />
              Load more partners
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
