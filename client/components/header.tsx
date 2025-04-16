"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Bell, Menu, Moon, Plus, Search, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { useTheme } from "next-themes"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { NewListingModal } from "./new-listing-modal"
import { useAuth } from "@/context/auth-context"

export default function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { toast } = useToast()
  const [newListingOpen, setNewListingOpen] = useState(false)
  const { user, logout } = useAuth()

  console.log("User in Header:", user)

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const allNavItems = [
    { name: "TRUSTED NETWORK PARTNER", href: "/", className: "font-bold hidden lg:block" },
    { name: "PROFILE", href: "/profile", protected: true },
    { name: "REAL ESTATE", href: "/real-estate" },
    { name: "PARTNERS", href: "/partners", protected: true },
    { name: "CHAT", href: "/chat", protected: true },
  ]

  // Фильтруем элементы навигации: показываем защищённые только если user есть
  const navItems = allNavItems.filter(item => !item.protected || user)

  const handleNewListing = () => {
    setNewListingOpen(true)
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-200",
          isScrolled
            ? "bg-white/80 backdrop-blur-md border-b shadow-sm dark:bg-gray-950/80"
            : "bg-white dark:bg-gray-950",
        )}
      >
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <SheetTitle>Menu</SheetTitle>
                <nav className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                        pathname === item.href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/5",
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/" className="font-bold text-lg text-primary hidden sm:block">
              RealEstate<span className="text-foreground">Pro</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors relative",
                  pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-primary",
                  item.className,
                )}
              >
                {item.name}
                {pathname === item.href && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() =>
                toast({
                  title: "Search",
                  description: "Search functionality coming soon",
                })
              }
            >
              <Search className="h-5 w-5" />
            </Button>

            {user && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    toast({
                      title: "Notifications",
                      description: "You have 3 unread notifications",
                    })
                  }
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="px-2 gap-2">
                      EUR
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
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast({ title: "Currency changed to EUR" })}>
                      EUR
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "Currency changed to USD" })}>
                      USD
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "Currency changed to GBP" })}>
                      GBP
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  className="bg-primary text-white hover:bg-primary/90 hidden sm:flex"
                  onClick={handleNewListing}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New listing
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground sm:hidden"
                  onClick={handleNewListing}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground"
            >
              {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 ml-2">
                  <Avatar className="h-8 w-8">
                    {user ? (
                      <>
                        <AvatarImage
                          src={
                            user.profilePicture ||
                            `/placeholder.svg?height=32&width=32&text=${user.username?.[0] || "U"}`
                          }
                          alt={user.username || "User"}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.username?.[0] || "U"}
                        </AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Guest" />
                        <AvatarFallback className="bg-primary/10 text-primary">GU</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user ? (
                  <>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm font-medium">{user.username || "User"}</p>
                        <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link href="/profile" className="flex w-full">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "Settings", description: "Opening settings..." })}>
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        logout()
                        toast({ title: "Logged out", description: "You have been logged out" })
                      }}
                    >
                      Logout
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem>
                      <Link href="/login" className="flex w-full">
                        Login
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/register" className="flex w-full">
                        Register
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <NewListingModal open={newListingOpen} onOpenChange={setNewListingOpen} />
    </>
  )
}