"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/protected-route";

export default function ChatPage() {
  const { toast } = useToast();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileContacts, setShowMobileContacts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Загрузка списка друзей
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        console.log("[Frontend] Fetching friends from /api/friends");
        const response = await fetch("http://localhost:5000/api/friends", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch friends");
        }

        const friends = await response.json();
        console.log("[Frontend] Friends fetched:", friends);
        setContacts(
          friends.map((friend: any) => ({
            id: friend.id.toString(),
            name: friend.username,
            avatar: friend.profilePicture || "/placeholder.svg?height=48&width=48",
            online: false,
            lastMessage: "",
            unread: false,
          }))
        );
        setLoading(false);
      } catch (error) {
        console.error("[Frontend] Error fetching friends:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load friends",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  // Загрузка сообщений для активного чата
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      try {
        console.log(`[Frontend] Fetching messages for friendId: ${activeChat}`);
        const response = await fetch(`http://localhost:5000/api/messages?friendId=${activeChat}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch messages");
        }

        const data = await response.json();
        console.log(`[Frontend] Messages fetched for friendId: ${activeChat}`, data);
        setMessages((prev) => ({
          ...prev,
          [activeChat]: data.map((msg: any) => ({
            id: msg.id,
            sender: msg.senderId.toString() === activeChat ? activeChat : "me",
            text: msg.content,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "read",
          })),
        }));
        scrollToBottom();
      } catch (error) {
        console.error("[Frontend] Error fetching messages:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load messages",
          variant: "destructive",
        });
      }
    };

    fetchMessages();
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeChat) {
      console.log("[Frontend] Message or activeChat is empty");
      return;
    }

    const newMessage = {
      friendId: parseInt(activeChat),
      content: message,
    };

    try {
      console.log("[Frontend] Sending message:", newMessage);
      const response = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newMessage),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }

      const sentMessage = await response.json();
      console.log("[Frontend] Message sent successfully:", sentMessage);
      setMessages((prev) => ({
        ...prev,
        [activeChat]: [
          ...(prev[activeChat] || []),
          {
            id: sentMessage.id,
            sender: "me",
            text: sentMessage.content,
            time: new Date(sentMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "sent",
          },
        ],
      }));
      setMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("[Frontend] Error sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const markAsRead = (contactId: string) => {
    setContacts((prev) =>
      prev.map((contact) => (contact.id === contactId ? { ...contact, unread: false } : contact))
    );
  };

  const getActiveContact = () => {
    return contacts.find((contact) => contact.id === activeChat);
  };

  if (loading) return <div className="container px-4 py-8">Loading...</div>;

  return (
    <ProtectedRoute>
    <div className="container h-[calc(100vh-4rem)] px-0 py-0 md:px-6 md:py-8">
      <div className="grid h-full grid-cols-1 overflow-hidden rounded-none border bg-white shadow-sm dark:bg-gray-900 md:rounded-xl lg:grid-cols-4">
        {/* Left Sidebar - Contacts */}
        <div className={cn("border-r lg:col-span-1", showMobileContacts ? "block" : "hidden lg:block")}>
          <div className="flex items-center justify-between border-b p-4">
            <h1 className="text-xl font-bold text-primary">CHAT</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
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
            <Input type="text" placeholder="Search friends..." className="pl-10" />
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
                      activeChat === contact.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    )}
                    onClick={() => {
                      setActiveChat(contact.id);
                      markAsRead(contact.id);
                      setShowMobileContacts(false);
                    }}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={contact.avatar} alt={contact.name} />
                        <AvatarFallback>{contact.name.split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
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
                  <Button variant="link" className="mt-2 text-primary">
                    Create a group
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content - Chat */}
        <div className={cn("flex h-full flex-col lg:col-span-3", showMobileContacts ? "hidden lg:flex" : "flex")}>
          {activeChat ? (
            <>
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setShowMobileContacts(true)}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={getActiveContact()?.avatar} alt={getActiveContact()?.name || ""} />
                    <AvatarFallback>
                      {(getActiveContact()?.name || "").split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{getActiveContact()?.name}</h2>
                    {/* <p className="text-xs text-muted-foreground">
                      {getActiveContact()?.online ? "Online" : "Last online: 4 hours ago"}
                    </p> */}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <VideoIcon className="h-5 w-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Notes</DropdownMenuItem>
                      <DropdownMenuItem>Shared media (12)</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Mute notifications</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Block contact</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
                <div className="mb-4 text-center">
                  <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    TODAY
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
                              .map((n: string) => n[0])
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

              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
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
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    variant="default"
                    size="icon"
                    onClick={handleSendMessage}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a friend to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}