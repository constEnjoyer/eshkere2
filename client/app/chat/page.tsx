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

            if (!userResponse.ok) {
              const text = await userResponse.text();
              console.error("[ChatPage] User fetch failed:", {
                status: userResponse.status,
                statusText: userResponse.statusText,
                responseText: text.slice(0, 200),
                cookies: document.cookie,
              });
              if (userResponse.status === 401 || friendsResponse.status === 403) {
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

    console.log("[ChatPage] Initializing Socket.IO, checking cookies:", document.cookie);
    const newSocket = io("http://localhost:5000", {
      auth: { withCredentials: true },
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
      toast({
        title: "Ошибка",
        description: "Сообщение или получатель не указаны",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("[ChatPage] Sending message:", { friendId: activeChat, content: message });
      const response = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ friendId: parseInt(activeChat), content: message }),
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

  if (isLoading) {
    return <div className="container px-4 py-8">Загрузка авторизации...</div>;
  }

  if (!user) {
    return <div className="container px-4 py-8">Необходимо войти в систему</div>;
  }

  if (loading) {
    return <div className="container px-4 py-8">Загрузка...</div>;
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col md:flex-row">
        <div
          className={cn(
            "w-full md:w-1/3 lg:w-1/4 bg-gray-100 p-4 overflow-y-auto",
            showMobileContacts ? "block" : "hidden md:block"
          )}
        >
          <h2 className="text-lg font-semibold mb-4">Чаты</h2>
          {contacts.length === 0 ? (
            <p className="text-gray-500">Нет контактов</p>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className={cn(
                  "flex items-center p-2 rounded-lg cursor-pointer",
                  activeChat === contact.id ? "bg-gray-200" : "hover:bg-gray-200"
                )}
                onClick={() => {
                  setActiveChat(contact.id);
                  setShowMobileContacts(false);
                }}
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={contact.avatar} alt={contact.name} />
                  <AvatarFallback>{contact.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-gray-500">{contact.online ? "Online" : "Offline"}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex-1 flex flex-col bg-white">
          {activeChat ? (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden mr-2"
                    onClick={() => setShowMobileContacts(true)}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage
                      src={contacts.find((c) => c.id === activeChat)?.avatar}
                      alt={contacts.find((c) => c.id === activeChat)?.name}
                    />
                    <AvatarFallback>
                      {contacts.find((c) => c.id === activeChat)?.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{contacts.find((c) => c.id === activeChat)?.name}</p>
                    <p className="text-sm text-gray-500">
                      {contacts.find((c) => c.id === activeChat)?.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setActiveChat(null)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {(messages[activeChat] || []).map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "mb-4 flex",
                      msg.sender === "me" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs p-3 rounded-lg",
                        msg.sender === "me" ? "bg-primary text-white" : "bg-gray-200"
                      )}
                    >
                      <p>{msg.text}</p>
                      <p className="text-xs mt-1 opacity-70">{msg.time}</p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t flex items-center">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Введите сообщение..."
                  className="flex-1 mr-2"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2" />
                <p>Выберите чат, чтобы начать общение</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}