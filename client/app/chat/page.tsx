"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Paperclip,
  ImageIcon,
  Video,
  Send,
  MessageSquare,
  Users,
  Phone,
  VideoIcon,
  Search,
  MoreVertical,
  ChevronLeft,
  X,
  Plus,
} from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export default function ChatPage() {
  const { toast } = useToast()
  const [activeChat, setActiveChat] = useState("cooper")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Record<string, any[]>>({
    cooper: [
      {
        id: "c1",
        sender: "cooper",
        text: "Hi, Kyle. How are you doing? Did you get that job yesterday?",
        time: "4:20",
        status: "read",
      },
      {
        id: "m1",
        sender: "me",
        text: "Nope, they kicked me out of the office!",
        time: "4:22",
        status: "read",
      },
      {
        id: "c2",
        sender: "cooper",
        text: "Wow! I can invite you in my new project. We need a product designer right now!",
        time: "4:25",
        status: "read",
      },
      {
        id: "m2",
        sender: "me",
        text: "That would be amazing! When can we discuss the details?",
        time: "4:26",
        status: "read",
      },
      {
        id: "m3",
        sender: "me",
        text: "Thanks for the opportunity!",
        time: "4:27",
        status: "read",
      },
    ],
    livia: [
      {
        id: "l1",
        sender: "livia",
        text: "Hey, I saw your portfolio. It's amazing!",
        time: "3:45",
        status: "read",
      },
    ],
    jordyn: [
      {
        id: "j1",
        sender: "jordyn",
        text: "Do you have time for a quick call today?",
        time: "Yesterday",
        status: "read",
      },
    ],
    theresa: [
      {
        id: "t1",
        sender: "theresa",
        text: "I have a new property listing that might interest you.",
        time: "Monday",
        status: "read",
      },
    ],
    andriy: [
      {
        id: "a1",
        sender: "andriy",
        text: "The documents are ready for signing.",
        time: "Last week",
        status: "read",
      },
    ],
    audrey: [],
    idealista: [],
  })

  const [contacts, setContacts] = useState([
    {
      id: "cooper",
      name: "Cooper Vaccaro",
      avatar: "/placeholder.svg?height=48&width=48",
      online: true,
      lastMessage: "Hey, how is your project?",
      unread: false,
    },
    {
      id: "livia",
      name: "Livia Mango",
      avatar: "/placeholder.svg?height=48&width=48",
      online: true,
      lastMessage: "Hey, how is your project?",
      unread: true,
    },
    {
      id: "jordyn",
      name: "Jordyn Lipshutz",
      avatar: "/placeholder.svg?height=48&width=48",
      online: true,
      lastMessage: "Hey, how is your project?",
      unread: true,
    },
    {
      id: "theresa",
      name: "Theresa Steward",
      avatar: "/placeholder.svg?height=48&width=48",
      online: false,
      lastMessage: "Hey, how is your project?",
      unread: false,
    },
    {
      id: "andriy",
      name: "Andriy Koshelevich",
      avatar: "/placeholder.svg?height=48&width=48",
      online: true,
      lastMessage: "Hey, how is your project?",
      unread: false,
    },
    {
      id: "audrey",
      name: "Audrey Alexander",
      avatar: "/placeholder.svg?height=48&width=48",
      online: false,
      lastMessage: "Hey, how is your project?",
      unread: false,
    },
    {
      id: "idealista",
      name: "Idealista",
      avatar: "/placeholder.svg?height=48&width=48",
      online: false,
      lastMessage: "Hey, how is your project?",
      unread: false,
      isCompany: true,
    },
  ])

  const [showMobileContacts, setShowMobileContacts] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages, activeChat])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: `m${Date.now()}`,
        sender: "me",
        text: message,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent",
      }

      setMessages((prev) => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), newMessage],
      }))

      setMessage("")

      // Simulate reply after 1-3 seconds
      if (Math.random() > 0.5) {
        const delay = 1000 + Math.random() * 2000
        setTimeout(() => {
          const replyMessage = {
            id: `r${Date.now()}`,
            sender: activeChat,
            text: "Thanks for your message! I'll get back to you soon.",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "sent",
          }

          setMessages((prev) => ({
            ...prev,
            [activeChat]: [...(prev[activeChat] || []), replyMessage],
          }))

          toast({
            title: "New message",
            description: `${contacts.find((c) => c.id === activeChat)?.name} sent you a message`,
          })
        }, delay)
      }
    }
  }

  const markAsRead = (contactId: string) => {
    setContacts((prev) => prev.map((contact) => (contact.id === contactId ? { ...contact, unread: false } : contact)))
  }

  const getActiveContact = () => {
    return contacts.find((contact) => contact.id === activeChat)
  }

  return (
    <div className="container h-[calc(100vh-4rem)] px-0 py-0 md:px-6 md:py-8">
      <div className="grid h-full grid-cols-1 overflow-hidden rounded-none border bg-white shadow-sm dark:bg-gray-900 md:rounded-xl lg:grid-cols-4">
        {/* Left Sidebar - Contacts */}
        <div className={cn("border-r lg:col-span-1", showMobileContacts ? "block" : "hidden lg:block")}>
          <div className="flex items-center justify-between border-b p-4">
            <h1 className="text-xl font-bold text-primary">CHAT</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() =>
                  toast({
                    title: "New chat",
                    description: "Start a new conversation with a contact",
                  })
                }
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full lg:hidden"
                onClick={() => setShowMobileContacts(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="relative p-2">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Search conversations..." className="pl-10" />
          </div>

          <Tabs defaultValue="direct" className="p-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="direct"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Direct
              </TabsTrigger>
              <TabsTrigger
                value="groups"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="mr-2 h-4 w-4" />
                Groups
              </TabsTrigger>
            </TabsList>

            <TabsContent value="direct" className="mt-4 space-y-1">
              <div className="space-y-1">
                {contacts.map((contact) => (
                  <motion.button
                    key={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors",
                      activeChat === contact.id ? "bg-primary/10 text-primary" : "hover:bg-muted",
                    )}
                    onClick={() => {
                      setActiveChat(contact.id)
                      markAsRead(contact.id)
                      setShowMobileContacts(false)
                    }}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={contact.avatar} alt={contact.name} />
                        <AvatarFallback className={contact.isCompany ? "bg-lime-100 text-lime-700" : ""}>
                          {contact.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {contact.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"></span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{contact.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {messages[contact.id]?.length > 0
                            ? messages[contact.id][messages[contact.id].length - 1].time
                            : ""}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {messages[contact.id]?.length > 0
                          ? (messages[contact.id][messages[contact.id].length - 1].sender === "me" ? "You: " : "") +
                            messages[contact.id][messages[contact.id].length - 1].text
                          : contact.lastMessage}
                      </p>
                    </div>
                    {contact.unread && <span className="ml-auto flex h-2 w-2 rounded-full bg-primary"></span>}
                  </motion.button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="groups" className="mt-4">
              <div className="flex h-40 items-center justify-center text-center text-muted-foreground">
                <div>
                  <p>No group chats yet</p>
                  <Button
                    variant="link"
                    className="mt-2 text-primary"
                    onClick={() =>
                      toast({
                        title: "Create group",
                        description: "Group creation functionality will be implemented soon",
                      })
                    }
                  >
                    Create a group
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content - Chat */}
        <div className={cn("flex h-full flex-col lg:col-span-3", showMobileContacts ? "hidden lg:flex" : "flex")}>
          {activeChat && (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setShowMobileContacts(true)}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={getActiveContact()?.avatar} alt={getActiveContact()?.name || ""} />
                    <AvatarFallback>
                      {(getActiveContact()?.name || "")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{getActiveContact()?.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {getActiveContact()?.online ? "Online" : "Last online: 4 hours ago"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() =>
                      toast({
                        title: "Voice call",
                        description: "Voice call functionality will be implemented soon",
                      })
                    }
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() =>
                      toast({
                        title: "Video call",
                        description: "Video call functionality will be implemented soon",
                      })
                    }
                  >
                    <VideoIcon className="h-5 w-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          toast({
                            title: "Notes",
                            description: "Chat notes will be displayed shortly",
                          })
                        }
                      >
                        Notes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          toast({
                            title: "Shared media",
                            description: "Shared media will be displayed shortly",
                          })
                        }
                      >
                        Shared media (12)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          toast({
                            title: "Mute notifications",
                            description: "Notifications for this chat have been muted",
                          })
                        }
                      >
                        Mute notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          toast({
                            title: "Block contact",
                            description: "Contact blocking functionality will be implemented soon",
                          })
                        }
                        className="text-destructive"
                      >
                        Block contact
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
                <div className="mb-4 text-center">
                  <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    YESTERDAY, 29 AUG 4:20
                  </span>
                </div>

                <div className="space-y-4">
                  {messages[activeChat]?.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex", msg.sender === "me" ? "justify-end" : "justify-start")}
                    >
                      {msg.sender !== "me" && (
                        <Avatar className="mr-2 h-8 w-8">
                          <AvatarImage
                            src={contacts.find((c) => c.id === msg.sender)?.avatar}
                            alt={contacts.find((c) => c.id === msg.sender)?.name || ""}
                          />
                          <AvatarFallback>
                            {(contacts.find((c) => c.id === msg.sender)?.name || "")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn("chat-bubble", msg.sender === "me" ? "chat-bubble-me" : "chat-bubble-other")}>
                        <p>{msg.text}</p>
                        <div className="chat-time">{msg.time}</div>
                      </div>
                      {msg.sender === "me" && (
                        <Avatar className="ml-2 h-8 w-8">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Me" />
                          <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                      )}
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Chat Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      toast({
                        title: "Attachment",
                        description: "Attachment functionality will be implemented soon",
                      })
                    }
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      toast({
                        title: "Image",
                        description: "Image upload functionality will be implemented soon",
                      })
                    }
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      toast({
                        title: "Video",
                        description: "Video upload functionality will be implemented soon",
                      })
                    }
                  >
                    <Video className="h-5 w-5" />
                  </Button>
                  <Input
                    type="text"
                    placeholder="Write your message"
                    className="flex-1"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    variant="primary"
                    size="icon"
                    onClick={handleSendMessage}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
