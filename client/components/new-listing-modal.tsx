"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";

interface Seller {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string | null;
  skills: string[];
}

interface Property {
  id: number;
  authorId: number;
  title: string;
  description: string;
  location: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  imageUrl?: string | null;
  createdAt: string;
  likes: number[];
  seller: Seller;
}

interface NewListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: (post: Property) => void;
}

export function NewListingModal({ open, onOpenChange, onPostCreated }: NewListingModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    squareMeters: "",
    imageUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите, чтобы создать объявление",
        variant: "destructive",
      });
      onOpenChange(false);
      return;
    }

    const data = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      price: parseFloat(formData.price) || 0,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
      squareMeters: formData.squareMeters ? parseInt(formData.squareMeters) : undefined,
      imageUrl: formData.imageUrl || undefined,
    };

    if (!data.title || !data.description || !data.location || !data.price) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля (название, описание, местоположение, цена)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("[NewListingModal] Sending POST /api/posts:", JSON.stringify(data, null, 2));
      const response = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      console.log("[NewListingModal] Response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("[NewListingModal] Error response:", errorData);
        throw new Error(errorData.message || `Failed to create post: ${response.status}`);
      }

      const responseData = await response.json();
      const newPost: Property = {
        ...responseData.post,
        likes: [],
        createdAt: new Date().toISOString(),
        seller: {
          id: user.id,
          name: user.username || "Unknown",
          email: user.email || "",
          phone: user.phone || "",
          avatar: user.profilePicture ? `http://localhost:5000${user.profilePicture}` : null,
          skills: user.skills || [],
        },
      };
      console.log("[NewListingModal] Post created:", JSON.stringify(newPost, null, 2));

      toast({
        title: "Успех",
        description: "Объявление успешно создано",
      });

      if (onPostCreated) {
        console.log("[NewListingModal] Calling onPostCreated with:", JSON.stringify(newPost, null, 2));
        onPostCreated(newPost);
      } else {
        console.warn("[NewListingModal] onPostCreated is not provided");
      }

      setFormData({
        title: "",
        description: "",
        location: "",
        price: "",
        bedrooms: "",
        bathrooms: "",
        squareMeters: "",
        imageUrl: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("[NewListingModal] Error creating post:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать объявление",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Создать новое объявление</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Название
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="col-span-3"
              placeholder="Например, Уютная квартира в центре"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Описание
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="col-span-3"
              placeholder="Опишите недвижимость"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Местоположение
            </Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="col-span-3"
              placeholder="Например, Москва, ул. Ленина"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Цена (€)
            </Label>
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              className="col-span-3"
              placeholder="500000"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bedrooms" className="text-right">
              Спальни
            </Label>
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={handleChange}
              className="col-span-3"
              placeholder="2"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bathrooms" className="text-right">
              Ванные
            </Label>
            <Input
              id="bathrooms"
              name="bathrooms"
              type="number"
              value={formData.bathrooms}
              onChange={handleChange}
              className="col-span-3"
              placeholder="1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="squareMeters" className="text-right">
              Площадь (м²)
            </Label>
            <Input
              id="squareMeters"
              name="squareMeters"
              type="number"
              value={formData.squareMeters}
              onChange={handleChange}
              className="col-span-3"
              placeholder="100"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="imageUrl" className="text-right">
              URL изображения
            </Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="col-span-3"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Создание..." : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}