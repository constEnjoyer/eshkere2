"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Trash2, Users, UserPlus, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProtectedRoute from "@/components/protected-route";

type Friend = {
  id: number;
  username: string;
  profilePicture?: string | null;
};

type User = {
  id: number;
  username: string;
  profilePicture?: string | null;
};

type FriendRequest = {
  id: number;
  userId: number;
  friendId: number;
  requester: {
    id: number;
    username: string;
    profilePicture?: string | null;
  };
};

export default function FriendsPage() {
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("[Frontend] Fetching friends and requests from /api/friends");
        
        // Fetch accepted friends
        const friendsResponse = await fetch("http://localhost:5000/api/friends", {
          method: "GET",
          credentials: "include",
        });
        if (!friendsResponse.ok) {
          const errorData = await friendsResponse.json();
          throw new Error(errorData.message || "Failed to fetch friends");
        }
        const friendsData: Friend[] = await friendsResponse.json();
        setFriends(friendsData);

        // Fetch pending friend requests
        const requestsResponse = await fetch("http://localhost:5000/api/friends/requests", {
          method: "GET",
          credentials: "include",
        });
        if (!requestsResponse.ok) {
          const errorData = await requestsResponse.json();
          throw new Error(errorData.message || "Failed to fetch friend requests");
        }
        const requestsData: FriendRequest[] = await requestsResponse.json();
        setFriendRequests(requestsData);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRemoveFriend = async (friendId: number) => {
    try {
      console.log(`[Frontend] Removing friend with ID: ${friendId}`);
      const response = await fetch(`http://localhost:5000/api/friends/${friendId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove friend");
      }

      setFriends(friends.filter((friend) => friend.id !== friendId));
      toast({
        title: "Success",
        description: "Friend removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove friend",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`[Frontend] Searching users with query: ${searchQuery}`);
      const response = await fetch(
        `http://localhost:5000/api/friends/search?query=${encodeURIComponent(searchQuery)}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to search users");
      }

      const data: User[] = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to search users",
        variant: "destructive",
      });
    }
  };

  const handleAddFriend = async (userId: number) => {
    try {
      console.log(`[Frontend] Sending friend request to userId: ${userId}`);
      const response = await fetch("http://localhost:5000/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ friendId: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send friend request");
      }

      toast({
        title: "Success",
        description: "Friend request sent successfully",
      });
      setSearchResults(searchResults.filter((user) => user.id !== userId));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const handleAcceptFriend = async (requestId: number, requesterId: number) => {
    try {
      console.log(`[Frontend] Accepting friend request with ID: ${requestId}`);
      const response = await fetch(`http://localhost:5000/api/friends/${requestId}/accept`, {
        method: "PUT",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to accept friend request");
      }

      const updatedFriendship = await response.json();
      setFriendRequests(friendRequests.filter((req) => req.id !== requestId));
      setFriends([...friends, {
        id: requesterId,
        username: updatedFriendship.requester.username,
        profilePicture: updatedFriendship.requester.profilePicture,
      }]);
      toast({
        title: "Success",
        description: "Friend request accepted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (loading) return <div className="container px-4 py-8">Loading...</div>;

  return (
    <ProtectedRoute>
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">FRIENDS</h1>
        <p className="mt-2 text-muted-foreground">Manage your network of friends</p>
      </motion.div>

      <Tabs defaultValue="friends" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">Friend Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {friends.length > 0 ? (
              friends.map((friend) => (
                <motion.div key={friend.id} variants={item}>
                  <div className="flex items-center justify-between rounded-xl border bg-white p-4 transition-all hover:border-primary/50 hover:shadow-md dark:bg-gray-900">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={friend.profilePicture || "/placeholder.svg?height=64&width=64"}
                          alt={friend.username}
                        />
                        <AvatarFallback>{friend.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold">{friend.username}</h3>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/profile/${friend.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-primary/5 hover:border-primary/50"
                        >
                          View Profile
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                        onClick={() => handleRemoveFriend(friend.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-muted-foreground">No friends yet.</p>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="requests">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {friendRequests.length > 0 ? (
              friendRequests.map((request) => (
                <motion.div key={request.id} variants={item}>
                  <div className="flex items-center justify-between rounded-xl border bg-white p-4 transition-all hover:border-primary/50 hover:shadow-md dark:bg-gray-900">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={request.requester.profilePicture || "/placeholder.svg?height=64&width=64"}
                          alt={request.requester.username}
                        />
                        <AvatarFallback>{request.requester.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold">{request.requester.username}</h3>
                        <p className="text-sm text-muted-foreground">Friend request</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-green-500/10 hover:text-green-500 hover:border-green-500"
                        onClick={() => handleAcceptFriend(request.id, request.requester.id)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-muted-foreground">No pending friend requests.</p>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900"
      >
        <h2 className="mb-4 text-lg font-semibold text-primary">SEARCH FRIENDS</h2>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.profilePicture || "/placeholder.svg?height=40&width=40"}
                      alt={user.username}
                    />
                    <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{user.username}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddFriend(user.id)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Friend
                </Button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="mt-6 w-full bg-primary hover:bg-primary/90">
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Friend
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Friend</DialogTitle>
            <DialogDescription>Search for users to add them as friends.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90">
              Search
            </Button>
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.profilePicture || "/placeholder.svg?height=40&width=40"}
                          alt={user.username}
                        />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{user.username}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddFriend(user.id)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </ProtectedRoute>
  );
}