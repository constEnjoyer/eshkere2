"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Home, MapPin, Euro, SquareIcon, Upload, Calendar } from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface NewListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: (post: any) => void;
}

export function NewListingModal({ open, onOpenChange, onPostCreated }: NewListingModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    address: "",
    propertyType: "",
    yearBuilt: "",
    bedrooms: "2",
    bathrooms: "1",
    squareMeters: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    console.log("[NewListingModal] Selected files:", files);

    const validFiles: File[] = [];
    const previews: string[] = [];

    for (let i = 0; i < Math.min(files.length, 10); i++) {
      const file = files[i];
      console.log("[NewListingModal] Processing file:", file.name, file.size, file.type);
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Файл слишком большой",
          description: `${file.name} превышает лимит 5MB`,
          variant: "destructive",
        });
        continue;
      }
      if (!["image/png", "image/jpeg", "image/gif"].includes(file.type)) {
        toast({
          title: "Неподдерживаемый формат",
          description: `${file.name} должен быть PNG, JPG или GIF`,
          variant: "destructive",
        });
        continue;
      }
      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    console.log("[NewListingModal] Valid files:", validFiles);
    setImages(validFiles);
    setImagePreviews(previews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !user.id) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите, чтобы создать объявление",
        variant: "destructive",
      });
      onOpenChange(false);
      return;
    }

    if (!formData.title || !formData.description || !formData.price || !formData.location) {
      toast({
        title: "Заполните обязательные поля",
        description: "Название, описание, цена и локация обязательны",
        variant: "destructive",
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "Требуется изображение",
        description: "Загрузите хотя бы одно изображение",
        variant: "destructive",
      });
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", parseFloat(formData.price).toString());
      formDataToSend.append("location", formData.location);
      if (formData.address) formDataToSend.append("address", formData.address);
      if (formData.propertyType) formDataToSend.append("propertyType", formData.propertyType);
      if (formData.yearBuilt) formDataToSend.append("yearBuilt", parseInt(formData.yearBuilt).toString());
      if (formData.bedrooms) formDataToSend.append("bedrooms", parseInt(formData.bedrooms).toString());
      if (formData.bathrooms) formDataToSend.append("bathrooms", parseInt(formData.bathrooms).toString());
      if (formData.squareMeters) formDataToSend.append("squareMeters", parseInt(formData.squareMeters).toString());
      images.forEach((file) => {
        formDataToSend.append("images", file);
      });

      console.log("[NewListingModal] Sending FormData:", formDataToSend);

      const res = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("[NewListingModal] Server error:", error);
        throw new Error(error.message || "Не удалось создать объявление");
      }

      const createdPost = await res.json();
      console.log("[NewListingModal] Post created:", createdPost);
      onPostCreated(createdPost);

      toast({
        title: "Объявление создано",
        description: `Ваше объявление "${formData.title}" успешно создано.`,
      });

      setFormData({
        title: "",
        description: "",
        price: "",
        location: "",
        address: "",
        propertyType: "",
        yearBuilt: "",
        bedrooms: "2",
        bathrooms: "1",
        squareMeters: "",
      });
      setImages([]);
      setImagePreviews([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error("[NewListingModal] Error creating listing:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать объявление",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Создать новое объявление
          </DialogTitle>
          <DialogDescription>Заполните детали ниже, чтобы создать новое объявление о недвижимости.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-right">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="например, Люксовая вилла с видом на море"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-right">
                Описание <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Опишите недвижимость..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="propertyType" className="text-right">
                Тип недвижимости
              </Label>
              <Select
                name="propertyType"
                value={formData.propertyType}
                onValueChange={(value) => handleSelectChange("propertyType", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Выберите тип недвижимости" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Квартира</SelectItem>
                  <SelectItem value="house">Дом</SelectItem>
                  <SelectItem value="villa">Вилла</SelectItem>
                  <SelectItem value="bungalow">Бунгало</SelectItem>
                  <SelectItem value="townhouse">Таунхаус</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="price" className="text-right">
                  Цена <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="например, 250000"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location" className="text-right">
                  Локация <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="например, Барселона, Испания"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="text-right">
                Адрес
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="например, Calle Finlandia 10"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="yearBuilt" className="text-right">
                  Год постройки
                </Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="yearBuilt"
                    name="yearBuilt"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={handleChange}
                    placeholder="например, 2010"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="squareMeters" className="text-right">
                  Площадь (м²)
                </Label>
                <div className="relative mt-1">
                  <SquareIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="squareMeters"
                    name="squareMeters"
                    type="number"
                    value={formData.squareMeters}
                    onChange={handleChange}
                    placeholder="например, 120"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedrooms" className="text-right">
                  Спальни
                </Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  placeholder="например, 2"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bathrooms" className="text-right">
                  Ванные
                </Label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  placeholder="например, 1"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-right">
                Изображения недвижимости <span className="text-red-500">*</span>
              </Label>
              <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary"
                    >
                      <span>Загрузить файлы</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/png,image/jpeg,image/gif"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="pl-1">или перетащите</p>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    PNG, JPG, GIF до 5MB (макс. 10 изображений)
                  </p>
                  {imagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <img
                          key={index}
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="h-16 w-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Создать объявление
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
