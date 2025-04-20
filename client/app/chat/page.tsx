"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare, ChevronLeft, X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Socket } from "socket.io-client";
import io from "socket.io-client";

interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  isActive: boolean;
  profilePicture?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  age?: number | null;
  skills: never[];
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
}

interface Message {
  id: number;
  sender: string;
  text: string;
  time: string;
  status: "sent" | "read";
}

interface SocketMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileContacts, setShowMobileContacts] = useState(true);
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let authCheckTimeout: NodeJS.Timeout;

    if (isLoading) {
      console.log("[ChatPage] Auth is loading, waiting...");
      return;
    }

    if (!user) {
      console.log("[ChatPage] No user, delaying redirect to login");
      authCheckTimeout = setTimeout(() => {
        toast({
          title: "Ошибка",
          description: "Требуется авторизация",
          variant: "destructive",
        });
        router.push("/login");
      }, 4000);
      setLoading(false);
      return;
    }

    const fetchContacts = async () => {
      try {
        setLoading(true);
        console.log("[ChatPage] Fetching friends from /api/friends", { userId: user.id });
        const friendsResponse = await fetch("http://localhost:5000/api/friends", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          signal: controller.signal,
        });

        console.log("[ChatPage] Friends response:", {
          status: friendsResponse.status,
          ok: friendsResponse.ok,
          headers: Object.fromEntries(friendsResponse.headers.entries()),
        });

        if (!friendsResponse.ok) {
          const text = await friendsResponse.text();
          console.error("[ChatPage] Friends fetch failed:", {
            status: friendsResponse.status,
            statusText: friendsResponse.statusText,
            responseText: text.slice(0, 200),
            cookies: document.cookie,
          });
          if (friendsResponse.status === 401 || friendsResponse.status === 403) {
            toast({
              title: "Ошибка авторизации",
              description: "Сессия истекла, войдите снова",
              variant: "destructive",
            });
            router.push("/login");
            return;
          }
          throw new Error(`Failed to fetch friends: ${friendsResponse.status} ${text.slice(0, 100)}`);
        }

        const friends: Array<{ id: number; username: string; profilePicture?: string }> =
          await friendsResponse.json();
        console.log("[ChatPage] Friends fetched:", friends);
        const mappedContacts: Contact[] = friends.map((friend) => ({
          id: friend.id.toString(),
          name: friend.username,
          avatar: friend.profilePicture ? `http://localhost:5000${friend.profilePicture}` : "/placeholder.svg",
          online: false,
        }));

        const storedChatId = localStorage.getItem("activeChat");
        if (storedChatId && !isNaN(parseInt(storedChatId))) {
          console.log("[ChatPage] Found activeChat in localStorage:", storedChatId);
          let contactExists = mappedContacts.find((contact) => contact.id === storedChatId);

          if (!contactExists) {
            console.log("[ChatPage] Fetching user data from /api/users/", storedChatId);
            const userResponse = await fetch(`http://localhost:5000/api/users/${storedChatId}`, {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
              },
              signal: controller.signal,
            });

            console.log("[ChatPage] User response:", {
              status: userResponse.status,
              ok: userResponse.ok,
              headers: Object.fromEntries(userResponse.headers.entries()),
            });

            if (!userResponse.ok) {
              const text = await userResponse.text();
              console.error("[ChatPage] User fetch failed:", {
                status: userResponse.status,
                statusText: userResponse.statusText,
                responseText: text.slice(0, 200),
                cookies: document.cookie,
              });
              if (userResponse.status === 401 || userResponse.status === 403) {
                toast({
                  title: "Ошибка авторизации",
                  description: "Сессия истекла, войдите снова",
                  variant: "destructive",
                });
                router.push("/login");
                return;
              }
              if (userResponse.status === 404) {
                toast({
                  title: "Ошибка",
                  description: "Пользователь не найден",
                  variant: "destructive",
                });
                localStorage.removeItem("activeChat");
                return;
              }
              throw new Error(`Failed to fetch user: ${userResponse.status} ${text.slice(0, 100)}`);
            }

            const userData: { id: number; username: string; profilePicture?: string } =
              await userResponse.json();
            contactExists = {
              id: userData.id.toString(),
              name: userData.username,
              avatar: userData.profilePicture ? `http://localhost:5000${userData.profilePicture}` : "/placeholder.svg",
              online: false,
            };
            mappedContacts.push(contactExists);
          }

          setActiveChat(storedChatId);
          setShowMobileContacts(false);
          localStorage.removeItem("activeChat");
        }

        setContacts(mappedContacts);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("[ChatPage] Error fetching contacts:", {
          message: error instanceof Error ? error.message : "Unknown error",
          name: error instanceof Error ? error.name : "Unknown",
          stack: error instanceof Error ? error.stack : "No stack",
        });
        toast({
          title: "Ошибка",
          description: `Не удалось загрузить контакты: ${
            error instanceof Error ? error.message : "Неизвестная ошибка"
          }`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();

    console.log("[ChatPage] Initializing Socket.IO");
    const newSocket = io("http://localhost:5000", {
      auth: {
        token: `Bearer ${document.cookie}`
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log(`[ChatPage] Connected to socket as user ${user?.id}`);
      toast({
        title: "Чат подключен",
        description: "Соединение с чатом установлено",
      });
    });

    newSocket.on("message", (msg: SocketMessage) => {
      console.log("[ChatPage] Received socket message:", msg);
      setMessages((prev) => {
        const chatId = msg.senderId.toString() === user?.id.toString() ? msg.receiverId.toString() : msg.senderId.toString();
        return {
          ...prev,
          [chatId]: [
            ...(prev[chatId] || []),
            {
              id: msg.id,
              sender: msg.senderId.toString() === user?.id.toString() ? "me" : chatId,
              text: msg.content,
              time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "read" as const,
            },
          ],
        };
      });
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    newSocket.on("error", (error: { message?: string } | null) => {
      console.error("[ChatPage] Socket error:", {
        error: error || "No error data",
        message: error?.message || "Unknown error",
        cookies: document.cookie,
      });
      toast({
        title: "Ошибка чата",
        description: `Не удалось подключиться к чату: ${error?.message || "Неизвестная ошибка"}`,
        variant: "destructive",
      });
    });

    newSocket.on("connect_error", (error: Error | null) => {
      console.error("[ChatPage] Socket connect_error:", {
        error: error || "No error data",
        message: error?.message || "Unknown error",
        stack: error?.stack || "No stack",
        cookies: document.cookie,
      });
      toast({
        title: "Ошибка соединения",
        description: `Не удалось подключиться к чату: ${error?.message || "Проверьте соединение"}`,
        variant: "destructive",
      });
    });

    return () => {
      clearTimeout(authCheckTimeout);
      newSocket.disconnect();
      console.log("[ChatPage] Socket disconnected");
      controller.abort();
    };
  }, [user, isLoading, toast, router]);

  useEffect(() => {
    if (!activeChat || !user) return;
    const controller = new AbortController();

    const fetchMessages = async () => {
      try {
        console.log(`[ChatPage] Fetching messages for friendId: ${activeChat}`);
        const response = await fetch(`http://localhost:5000/api/messages?friendId=${activeChat}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          signal: controller.signal,
        });

        console.log("[ChatPage] Messages response:", {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error("[ChatPage] Messages fetch failed:", {
            status: response.status,
            statusText: response.statusText,
            responseText: text.slice(0, 200),
            cookies: document.cookie,
          });
          if (response.status === 401 || response.status === 403) {
            toast({
              title: "Ошибка авторизации",
              description: "Сессия истекла, войдите снова",
              variant: "destructive",
            });
            router.push("/login");
            return;
          }
          throw new Error(`Failed to fetch messages: ${response.status} ${text.slice(0, 100)}`);
        }

        const data: Array<{ id: number; senderId: number; content: string; createdAt: string }> =
          await response.json();
        setMessages((prev) => ({
          ...prev,
          [activeChat]: data.map((msg) => ({
            id: msg.id,
            sender: msg.senderId.toString() === user.id.toString() ? "me" : activeChat,
            text: msg.content,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "read" as const,
          })),
        }));
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("[ChatPage] Error fetching messages:", {
          message: error instanceof Error ? error.message : "Unknown error",
          name: error instanceof Error ? error.name : "Unknown",
          stack: error instanceof Error ? error.stack : "No stack",
        });
        toast({
          title: "Ошибка",
          description: `Не удалось загрузить сообщения: ${
            error instanceof Error ? error.message : "Неизвестная ошибка"
          }`,
          variant: "destructive",
        });
      }
    };

    fetchMessages();
    return () => controller.abort();
  }, [activeChat, user, toast, router]);

  const handleSendMessage = async () => {
    if (!message.trim() || !activeChat || !user) {
      console.log("[ChatPage] Cannot send message:", {
        message: !!message.trim(),
        activeChat: !!activeChat,
        user: !!user,
      });
      toast({
        title: "Ошибка",
        description: "Сообщение или получатель не указаны",
        variant: "destructive",
      });
      return;
    }

    const friendId = parseInt(activeChat, 10);
    if (isNaN(friendId)) {
      console.error("[ChatPage] Invalid friendId:", activeChat);
      toast({
        title: "Ошибка",
        description: "Недействительный ID получателя",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("[ChatPage] Sending message:", { friendId, content: message });
      const response = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ friendId, content: message }),
      });

      console.log("[ChatPage] Message send response:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("[ChatPage] Message send failed:", {
          status: response.status,
          statusText: response.statusText,
          responseText: text.slice(0, 200),
          cookies: document.cookie,
        });
        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Ошибка авторизации",
            description: "Сессия истекла, войдите снова",
            variant: "destructive",
          });
          router.push("/login");
          return;
        }
        throw new Error(`Failed to send message: ${response.status} ${text.slice(0, 100)}`);
      }

      const sentMessage: { id: number; content: string; createdAt: string } = await response.json();
      setMessages((prev) => ({
        ...prev,
        [activeChat]: [
          ...(prev[activeChat] || []),
          {
            id: sentMessage.id,
            sender: "me",
            text: sentMessage.content,
            time: new Date(sentMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "sent" as const,
          },
        ],
      }));
      setMessage("");
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error: unknown) {
      console.error("[ChatPage] Error sending message:", {
        message: error instanceof Error ? error.message : "Unknown error",
        name: error instanceof Error ? error.name : "Unknown",
        stack: error instanceof Error ? error.stack : "No stack",
      });
      toast({
        title: "Ошибка",
        description: `Не удалось отправить сообщение: ${
          error instanceof Error ? error.message : "Неизвестная ошибка"
        }`,
        variant: "destructive",
      });
    }
  };

  const handleSelectChat = (contactId: string) => {
    console.log("[ChatPage] Selecting chat:", contactId);
    setActiveChat(contactId);
    setShowMobileContacts(false);
  };

  const handleBackToContacts = () => {
    console.log("[ChatPage] Back to contacts");
    setShowMobileContacts(true);
  };

  const handleCloseChat = () => {
    console.log("[ChatPage] Closing chat");
    setActiveChat(null);
    setShowMobileContacts(true);
  };

  if (isLoading) {
    console.log("[ChatPage] Rendering: isLoading");
    return <div className="container px-4 py-8">Проверка авторизации...</div>;
  }

  if (!user) {
    console.log("[ChatPage] Rendering: no user");
    return <div className="container px-4 py-8">Необходимо войти в систему</div>;
  }

  if (loading) {
    console.log("[ChatPage] Rendering: loading");
    return <div className="container px-4 py-8">Загрузка...</div>;
  }

  console.log("[ChatPage] Rendering with contacts:", contacts.length, "activeChat:", activeChat);

  return (
    <ProtectedRoute>
      <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto">
        <motion.div
          className={cn(
            "w-full md:w-1/3 border-r flex flex-col bg-white dark:bg-gray-900",
            showMobileContacts ? "block" : "hidden md:block"
          )}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Чаты</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Нет контактов. Добавьте друзей, чтобы начать чат.
              </div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={cn(
                    "flex items-center p-4 cursor-pointer hover:bg-muted",
                    activeChat === contact.id && "bg-muted"
                  )}
                  onClick={() => handleSelectChat(contact.id)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contact.avatar} alt={contact.name} />
                    <AvatarFallback>{contact.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{contact.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {contact.online ? "Онлайн" : "Оффлайн"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          className={cn(
            "flex-1 flex flex-col",
            showMobileContacts ? "hidden" : "block"
          )}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {activeChat ? (
            <>
              <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-gray-900">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden mr-2"
                    onClick={handleBackToContacts}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={contacts.find((c) => c.id === activeChat)?.avatar}
                      alt={contacts.find((c) => c.id === activeChat)?.name}
                    />
                    <AvatarFallback>
                      {contacts.find((c) => c.id === activeChat)?.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="ml-3 font-medium">
                    {contacts.find((c) => c.id === activeChat)?.name}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCloseChat}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {messages[activeChat]?.length ? (
                  messages[activeChat].map((msg) => (
                    <motion.div
                      key={msg.id}
                      className={cn(
                        "mb-4 flex",
                        msg.sender === "me" ? "justify-end" : "justify-start"
                      )}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg p-3",
                          msg.sender === "me"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p>{msg.text}</p>
                        <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                          <span>{msg.time}</span>
                          {msg.sender === "me" && (
                            <span>{msg.status === "sent" ? "Отправлено" : "Прочитано"}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    Нет сообщений. Начните разговор!
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t bg-white dark:bg-gray-900">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                <p>Выберите чат, чтобы начать общение</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}