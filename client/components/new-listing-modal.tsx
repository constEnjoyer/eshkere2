"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Home, MapPin, Euro, SquareIcon, Calendar, Upload } from "lucide-react"
import { useAuth } from "@/context/auth-context"

interface NewListingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewListingModal({ open, onOpenChange }: NewListingModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    address: "",
    propertyType: "apartment",
    bedrooms: "2",
    bathrooms: "1",
    area: "",
    yearBuilt: "",
  })

  const { user } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!formData.title || !formData.price || !formData.location) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Check if user is logged in
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a listing",
        variant: "destructive",
      })
      onOpenChange(false)
      return
    }

    // Create a new listing object
    const newListing = {
      id: `listing-${Date.now()}`,
      title: formData.title,
      location: formData.location,
      address: formData.address,
      price: `${formData.price}€`,
      beds: Number.parseInt(formData.bedrooms),
      baths: Number.parseInt(formData.bathrooms),
      size: `${formData.area}m²`,
      seller: {
        name: `${user.firstName} ${user.lastName}`,
        phone: "+34 677 130 650", // Default phone
        email: user.email,
      },
      createdAt: Date.now(),
    }

    // In a real application, you would typically dispatch an action or call an API here
    // For this example, we'll simulate adding the listing by storing it in localStorage
    try {
      const existingListings = JSON.parse(localStorage.getItem("realEstateListings") || "[]")
      const updatedListings = [...existingListings, newListing]
      localStorage.setItem("realEstateListings", JSON.stringify(updatedListings))

      // Display success message
      toast({
        title: "Property listing created!",
        description: `Your listing "${formData.title}" has been created successfully.`,
      })

      // Reset form and close modal
      setFormData({
        title: "",
        description: "",
        price: "",
        location: "",
        address: "",
        propertyType: "apartment",
        bedrooms: "2",
        bathrooms: "1",
        area: "",
        yearBuilt: "",
      })
      onOpenChange(false)

      // Refresh the page to show the new listing
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error creating listing",
        description: "There was a problem creating your listing. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Create New Property Listing
          </DialogTitle>
          <DialogDescription>Fill in the details below to create a new property listing.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-right">
                Property Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Luxury Villa with Sea View"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the property..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="price" className="text-right">
                  Price <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="e.g. 250000"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="propertyType" className="text-right">
                  Property Type
                </Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => handleSelectChange("propertyType", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="location" className="text-right">
                Location <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Barcelona, Spain"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="text-right">
                Full Address
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Calle Finlandia 10 3ºB Torrevieja 03183"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <Label htmlFor="bedrooms" className="text-right">
                  Bedrooms
                </Label>
                <Select value={formData.bedrooms} onValueChange={(value) => handleSelectChange("bedrooms", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Beds" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bathrooms" className="text-right">
                  Bathrooms
                </Label>
                <Select value={formData.bathrooms} onValueChange={(value) => handleSelectChange("bathrooms", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Baths" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="area" className="text-right">
                  Area (m²)
                </Label>
                <div className="relative mt-1">
                  <SquareIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="area"
                    name="area"
                    type="number"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="e.g. 120"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="yearBuilt" className="text-right">
                  Year Built
                </Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="yearBuilt"
                    name="yearBuilt"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={handleChange}
                    placeholder="e.g. 2020"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-right">Property Images</Label>
              <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary"
                    >
                      <span>Upload files</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, GIF up to 10MB (max. 8 images)</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Create Listing
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
