"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Calendar,
  Bed,
  Bath,
  SquareIcon,
  ArrowLeft,
  Heart,
  Share2,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
} from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

export default function PropertyDetailPage() {
  const { toast } = useToast()
  const [favorite, setFavorite] = useState(false)

  const toggleFavorite = () => {
    setFavorite(!favorite)
    toast({
      title: favorite ? "Removed from favorites" : "Added to favorites",
      description: favorite
        ? "Property has been removed from your favorites"
        : "Property has been added to your favorites",
    })
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Link
          href="/real-estate"
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          BACK TO LISTING
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Property Images */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 gap-4">
            <div className="relative h-[400px] overflow-hidden rounded-xl">
              <div className="absolute left-3 top-3 z-10 rounded-md bg-black/20 backdrop-blur-sm px-2 py-1 text-xs text-white">
                Last viewing 90 min
              </div>
              <Image
                src="/placeholder.svg?height=800&width=1200"
                alt="Property main image"
                fill
                className="object-cover"
              />
              <div className="absolute top-3 right-3 z-10 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-white/90 hover:bg-white"
                  onClick={toggleFavorite}
                >
                  <Heart className={`h-4 w-4 ${favorite ? "fill-primary text-primary" : "text-gray-700"}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-white/90 hover:bg-white"
                  onClick={() =>
                    toast({
                      title: "Shared",
                      description: "Property link has been copied to clipboard",
                    })
                  }
                >
                  <Share2 className="h-4 w-4 text-gray-700" />
                </Button>
              </div>
              <div className="absolute bottom-3 right-3 flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <Avatar key={i} className="h-8 w-8 border-2 border-white">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">U{i}</AvatarFallback>
                  </Avatar>
                ))}
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-xs text-white">
                  +1
                </div>
              </div>
              <Button
                variant="secondary"
                className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-gray-700"
                onClick={() =>
                  toast({
                    title: "Gallery",
                    description: "Full gallery view will be implemented soon",
                  })
                }
              >
                View All Gallery
              </Button>
            </div>

            <Carousel className="w-full">
              <CarouselContent>
                {[1, 2, 3, 4, 5].map((item) => (
                  <CarouselItem key={item} className="basis-1/3 md:basis-1/4">
                    <div className="relative h-48 overflow-hidden rounded-lg">
                      <Image
                        src={`/placeholder.svg?height=400&width=600&text=Image ${item}`}
                        alt={`Property image ${item}`}
                        fill
                        className="object-cover transition-transform hover:scale-110 cursor-pointer"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <span className="text-xl font-bold">5.00</span>
                <span className="ml-1">(98)</span>
              </div>
              <span>•</span>
              <span className="flex items-center">
                <MapPin className="mr-1 h-4 w-4 text-primary" />
                Kiev, Ukraine
              </span>
              <span>•</span>
              <span>Calle Finlandia 10 3ºB Torrevieja 03183</span>
            </div>

            <h1 className="mt-2 text-3xl font-bold">Villa in Kiev with a beautiful view of the city</h1>
            <div className="mt-4 flex flex-wrap gap-4">
              <Badge variant="outline" className="flex items-center gap-1 bg-primary/5">
                <Bed className="h-3 w-3 text-primary" />2 bedrooms
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 bg-primary/5">
                <Bath className="h-3 w-3 text-primary" />2 bathrooms
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 bg-primary/5">
                <SquareIcon className="h-3 w-3 text-primary" />
                90m²
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 bg-primary/5">
                <Calendar className="h-3 w-3 text-primary" />
                Built in 2018
              </Badge>
            </div>
            <div className="mt-4 text-3xl font-bold text-primary">350.000€</div>

            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-primary">ABOUT</h2>
              <div className="rounded-lg border p-4 bg-muted/30">
                <p className="text-muted-foreground">
                  The purpose of lorem ipsum is to create a natural looking block of text (sentence, paragraph, page,
                  etc.) that doesn't distract from the layout. A practice not without controversy, laying out pages with
                  meaningless filler text can be very useful when the focus is meant to be on design, not content.
                </p>
                <p className="mt-4 text-muted-foreground">
                  The passage experienced a surge in popularity during the 1960s when Letraset used it on their
                  dry-transfer sheets, and again during the 90s as desktop publishers bundled the text with their
                  software. Today it's seen all around the web; on templates, websites, and stock designs. Use our
                  generator to get your own, or read on for the authoritative history of lorem ipsum. Until recently,
                  the prevailing view assumed lorem ipsum was born.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-primary">FACTS</h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-sm">
                  <h3 className="font-medium text-primary">APPLIANCES</h3>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2 text-muted-foreground">
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
                        className="h-5 w-5 text-primary"
                      >
                        <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
                        <circle cx="6.5" cy="16.5" r="2.5" />
                        <circle cx="16.5" cy="16.5" r="2.5" />
                      </svg>
                      Free parking
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
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
                        className="h-5 w-5 text-primary"
                      >
                        <path d="M12 12c-2-2.96-1.4-6.5 2-8.5s7.2-.98 8.5 2-1 6-5 8m-7.17 1.5c-2.37 1.2-4.33 3.85-4.33 6.5h7.5m-7.5-3h7.5" />
                      </svg>
                      Energy Class: A
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
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
                        className="h-5 w-5 text-primary"
                      >
                        <path d="M3 22v-2a4 4 0 0 1 4-4h2" />
                        <path d="M17 16h2a4 4 0 0 1 4 4v2" />
                        <path d="M7 10a4 4 0 0 1 4-4h2" />
                        <path d="M17 6h2a4 4 0 0 1 4 4v2" />
                      </svg>
                      2 bedroom
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
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
                        className="h-5 w-5 text-primary"
                      >
                        <path d="M9 6h8a2 2 0 0 1 2 2v1" />
                        <path d="M7 13h10" />
                        <path d="M17 18H5a2 2 0 0 1-2-2V7" />
                        <path d="M18 18v3" />
                        <path d="M18 3v3" />
                        <path d="M5 13V7a2 2 0 0 1 2-2h2" />
                      </svg>
                      2 bathroom
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-sm">
                  <h3 className="font-medium text-primary">LANDSCAPE</h3>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2 text-muted-foreground">
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
                        className="h-5 w-5 text-primary"
                      >
                        <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
                        <circle cx="6.5" cy="16.5" r="2.5" />
                        <circle cx="16.5" cy="16.5" r="2.5" />
                      </svg>
                      Free parking
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
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
                        className="h-5 w-5 text-primary"
                      >
                        <path d="M12 12c-2-2.96-1.4-6.5 2-8.5s7.2-.98 8.5 2-1 6-5 8m-7.17 1.5c-2.37 1.2-4.33 3.85-4.33 6.5h7.5m-7.5-3h7.5" />
                      </svg>
                      Energy Class: A
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
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
                        className="h-5 w-5 text-primary"
                      >
                        <path d="M3 22v-2a4 4 0 0 1 4-4h2" />
                        <path d="M17 16h2a4 4 0 0 1 4 4v2" />
                        <path d="M7 10a4 4 0 0 1 4-4h2" />
                        <path d="M17 6h2a4 4 0 0 1 4 4v2" />
                      </svg>
                      2 bedroom
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
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
                        className="h-5 w-5 text-primary"
                      >
                        <path d="M9 6h8a2 2 0 0 1 2 2v1" />
                        <path d="M7 13h10" />
                        <path d="M17 18H5a2 2 0 0 1-2-2V7" />
                        <path d="M18 18v3" />
                        <path d="M18 3v3" />
                        <path d="M5 13V7a2 2 0 0 1 2-2h2" />
                      </svg>
                      2 bathroom
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-sm">
                  <h3 className="font-medium text-primary">COMMON AREAS</h3>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2 text-muted-foreground">
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
                        className="h-5 w-5 text-primary"
                      >
                        <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
                        <circle cx="6.5" cy="16.5" r="2.5" />
                        <circle cx="16.5" cy="16.5" r="2.5" />
                      </svg>
                      Free parking
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
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
                        className="h-5 w-5 text-primary"
                      >
                        <path d="M12 12c-2-2.96-1.4-6.5 2-8.5s7.2-.98 8.5 2-1 6-5 8m-7.17 1.5c-2.37 1.2-4.33 3.85-4.33 6.5h7.5m-7.5-3h7.5" />
                      </svg>
                      Energy Class: A
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
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
                        className="h-5 w-5 text-primary"
                      >
                        <path d="M3 22v-2a4 4 0 0 1 4-4h2" />
                        <path d="M17 16h2a4 4 0 0 1 4 4v2" />
                        <path d="M7 10a4 4 0 0 1 4-4h2" />
                        <path d="M17 6h2a4 4 0 0 1 4 4v2" />
                      </svg>
                      2 bedroom
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
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
                        className="h-5 w-5 text-primary"
                      >
                        <path d="M9 6h8a2 2 0 0 1 2 2v1" />
                        <path d="M7 13h10" />
                        <path d="M17 18H5a2 2 0 0 1-2-2V7" />
                        <path d="M18 18v3" />
                        <path d="M18 3v3" />
                        <path d="M5 13V7a2 2 0 0 1 2-2h2" />
                      </svg>
                      2 bathroom
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <Button
            className="w-full bg-primary text-white hover:bg-primary/90"
            onClick={() =>
              toast({
                title: "Deposit requested",
                description: "Your deposit request has been sent to the seller",
              })
            }
          >
            PURCHASE A DEPOSIT
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="w-full hover:bg-primary/5 hover:border-primary/50"
              onClick={() =>
                toast({
                  title: "Viewing scheduled",
                  description: "You will receive a confirmation email shortly",
                })
              }
            >
              BOOK A VIEWING
            </Button>
            <Button
              variant="outline"
              className="w-full hover:bg-primary/5 hover:border-primary/50"
              onClick={() =>
                toast({
                  title: "Inquiry sent",
                  description: "The agent will contact you shortly",
                })
              }
            >
              LEAVE A INQUIRY
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex items-center justify-start gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/50"
              onClick={() =>
                toast({
                  title: "Customer registration",
                  description: "Registration form will open shortly",
                })
              }
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
              Register customer
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-start gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/50"
              onClick={() =>
                toast({
                  title: "Commission calculator",
                  description: "Commission calculator will open shortly",
                })
              }
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Commission
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex items-center justify-start gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/50"
              onClick={() =>
                toast({
                  title: "Calendar opened",
                  description: "Viewing calendar will open shortly",
                })
              }
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
              Calendar of viewings
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-start gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/50"
              onClick={() =>
                toast({
                  title: "Print version",
                  description: "Print-friendly version will open in a new tab",
                })
              }
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
                <path d="M17 17h.01" />
                <path d="M17 21h-4a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3h3a1 1 0 0 1 1 1v6Z" />
                <path d="M17 13h-4a3 3 0 0 1-3-3V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1Z" />
              </svg>
              Print
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="w-full bg-primary text-white hover:bg-primary/90"
              onClick={() =>
                toast({
                  title: "Virtual tour",
                  description: "Virtual tour will open in a new window",
                })
              }
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              VIRTUAL TOUR
            </Button>
            <Button
              variant="outline"
              className="w-full hover:bg-primary/5 hover:border-primary/50"
              onClick={() =>
                toast({
                  title: "Room view",
                  description: "Room view will open shortly",
                })
              }
            >
              SHOW ROOM
            </Button>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900">
            <div className="flex items-start gap-3">
              <Avatar className="h-16 w-16 border-2 border-primary/10">
                <AvatarImage src="/placeholder.svg?height=64&width=64" alt="Ruben Bothman" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">RB</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold">Ruben Bothman</h3>
                <p className="text-sm text-muted-foreground">Real estate agent</p>

                <div className="mt-2 grid grid-cols-1 gap-y-1 text-sm">
                  <Button variant="link" size="sm" className="h-auto p-0 flex items-center justify-start text-primary">
                    <Phone className="mr-2 h-4 w-4" />
                    +34 677 130 650
                  </Button>
                  <Button variant="link" size="sm" className="h-auto p-0 flex items-center justify-start text-primary">
                    <Mail className="mr-2 h-4 w-4" />
                    ruben.bothman@gmail.com
                  </Button>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              The passage experienced a surge in popularity during the 1960s when Letraset used it on their dry-transfer
              sheets, and again during the 90s as desktop publishers bundled.
            </p>

            <div className="mt-4 flex gap-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90">
                <MessageSquare className="mr-2 h-4 w-4" />
                SEND MESSAGE
              </Button>
              <Button variant="outline" className="flex-1 hover:bg-primary/5 hover:border-primary/50">
                <Phone className="mr-2 h-4 w-4" />
                CALL
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900">
            <h3 className="font-bold">Similar Properties</h3>
            <div className="mt-4 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3 group">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={`/placeholder.svg?height=64&width=64&text=Property ${i}`}
                      alt={`Similar property ${i}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium group-hover:text-primary transition-colors">Villa with sea view</h4>
                    <p className="text-xs text-muted-foreground">Torrevieja, Spain</p>
                    <p className="text-sm font-bold text-primary">€320,000</p>
                  </div>
                </div>
              ))}
              <Button variant="link" className="w-full text-primary">
                View more similar properties
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
