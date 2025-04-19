"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar?: string | null;
  skills: string[];
}

interface Property {
  id: number;
  authorId: string;
  title: string;
  description: string;
  location: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  imageUrls: string[];
  createdAt: string;
  likes: string[];
  seller: Seller;
}

interface NewListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: (post: Property) => void;
}

export default function NewListingModal({ open, onOpenChange, onPostCreated }: NewListingModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareMeters, setSquareMeters] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) newErrors.title = "Название обязательно";
    if (!description.trim()) newErrors.description = "Описание обязательно";
    if (!location.trim()) newErrors.location = "Местоположение обязательно";
    if (!price || isNaN(Number(price)) || Number(price) <= 0)
      newErrors.price = "Введите корректную цену";
    if (files.length === 0) newErrors.images = "Требуется хотя бы одно изображение";
    if (files.length > 10) newErrors.images = "Максимум 10 изображений";
    if (bedrooms && (isNaN(Number(bedrooms)) || Number(bedrooms) < 0))
      newErrors.bedrooms = "Введите корректное количество спален";
    if (bathrooms && (isNaN(Number(bathrooms)) || Number(bathrooms) < 0))
      newErrors.bathrooms = "Введите корректное количество ванных комнат";
    if (squareMeters && (isNaN(Number(squareMeters)) || Number(squareMeters) <= 0))
      newErrors.squareMeters = "Введите корректную площадь";

    setErrors(newErrors);
    console.log("[NewListingModal] Validation errors:", newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) => {
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Ошибка",
            description: `Файл ${file.name} не является изображением`,
            variant: "destructive",
          });
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Ошибка",
            description: `Файл ${file.name} превышает 5 МБ`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

      console.log(
        "[NewListingModal] Selected files:",
        newFiles.map((f) => ({ name: f.name, size: f.size }))
      );

      setFiles((prev) => {
        const updatedFiles = [...prev, ...newFiles].slice(0, 10);
        console.log(
          "[NewListingModal] Updated files:",
          updatedFiles.map((f) => f.name)
        );
        return updatedFiles;
      });

      setErrors((prev) => {
        const { images, ...rest } = prev;
        return rest;
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    console.log("[NewListingModal] Removed file at index:", index);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setPrice("");
    setBedrooms("");
    setBathrooms("");
    setSquareMeters("");
    setFiles([]);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      console.log("[NewListingModal] Form validation failed:", errors);
      toast({
        title: "Ошибка",
        description: "Пожалуйста, исправьте ошибки в форме",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("price", price);
    if (bedrooms) formData.append("bedrooms", bedrooms);
    if (bathrooms) formData.append("bathrooms", bathrooms);
    if (squareMeters) formData.append("squareMeters", squareMeters);

    files.forEach((file, index) => {
      formData.append("images", file);
      console.log(`[NewListingModal] Adding file ${index + 1}: ${file.name}, size: ${file.size}`);
    });

    try {
      console.log("[NewListingModal] Sending request to http://localhost:5000/api/posts");
      const response = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[NewListingModal] Post creation failed:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        if (response.status === 401) {
          throw new Error("Требуется авторизация. Пожалуйста, войдите в систему.");
        }
        if (response.status === 413) {
          throw new Error("Слишком большой размер файлов. Уменьшите размер изображений.");
        }
        throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
      }

      const data: Property = await response.json();
      console.log("[NewListingModal] Post created:", {
        id: data.id,
        title: data.title,
        imageUrls: data.imageUrls,
      });

      toast({
        title: "Успех",
        description: "Объявление успешно создано",
      });

      resetForm();
      onOpenChange(false);
      if (onPostCreated) onPostCreated(data);
    } catch (error: any) {
      console.error("[NewListingModal] Error:", error.message, error.stack);
      let errorMessage = "Не удалось создать объявление";
      if (error.message.includes("Failed to fetch")) {
        errorMessage = "Не удалось подключиться к серверу. Проверьте, запущен ли сервер на localhost:5000.";
      } else if (error.message.includes("Требуется авторизация")) {
        errorMessage = error.message;
      } else if (error.message.includes("Слишком большой размер")) {
        errorMessage = error.message;
      }
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новое объявление</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название объявления"
            />
            {errors.title && <p className="text-destructive text-sm">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите недвижимость"
              rows={4}
            />
            {errors.description && <p className="text-destructive text-sm">{errors.description}</p>}
          </div>
          <div>
            <Label htmlFor="location">Местоположение</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Город, адрес"
            />
            {errors.location && <p className="text-destructive text-sm">{errors.location}</p>}
          </div>
          <div>
            <Label htmlFor="price">Цена (€)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Цена"
              min="0"
            />
            {errors.price && <p className="text-destructive text-sm">{errors.price}</p>}
          </div>
          <div>
            <Label htmlFor="bedrooms">Спальни</Label>
            <Input
              id="bedrooms"
              type="number"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              placeholder="Количество спален"
              min="0"
            />
            {errors.bedrooms && <p className="text-destructive text-sm">{errors.bedrooms}</p>}
          </div>
          <div>
            <Label htmlFor="bathrooms">Ванные комнаты</Label>
            <Input
              id="bathrooms"
              type="number"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              placeholder="Количество ванных комнат"
              min="0"
            />
            {errors.bathrooms && <p className="text-destructive text-sm">{errors.bathrooms}</p>}
          </div>
          <div>
            <Label htmlFor="squareMeters">Площадь (м²)</Label>
            <Input
              id="squareMeters"
              type="number"
              value={squareMeters}
              onChange={(e) => setSquareMeters(e.target.value)}
              placeholder="Площадь"
              min="0"
            />
            {errors.squareMeters && <p className="text-destructive text-sm">{errors.squareMeters}</p>}
          </div>
          <div>
            <Label htmlFor="images">Изображения (макс. 10)</Label>
            <Input
              id="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    {file.name}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-destructive"
                    >
                      Удалить
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {errors.images && <p className="text-destructive text-sm">{errors.images}</p>}
          </div>
          <div className="sticky bottom-0 bg-white py-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log("[NewListingModal] Closing modal");
                onOpenChange(false);
              }}
            >
              Отмена
            </Button>
            <Button type="submit">Создать</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}