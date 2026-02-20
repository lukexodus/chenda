"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductTypeCombobox } from "./ProductTypeCombobox";
import { productsApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { ProductType, SellerProduct } from "@/lib/types/seller";
import { toast } from "sonner";

interface ProductFormProps {
  product?: SellerProduct;
  isEdit?: boolean;
}

const STORAGE_CONDITIONS = [
  { value: "room_temp", label: "Room Temperature" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "frozen", label: "Frozen" },
];

const UNITS = ["kg", "g", "lb", "oz", "pcs", "dozen", "bundle"];

export function ProductForm({ product, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [selectedType, setSelectedType] = useState<ProductType | null>(null);
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [quantity, setQuantity] = useState(product?.quantity.toString() || "");
  const [unit, setUnit] = useState(product?.unit || "kg");
  const [daysUsed, setDaysUsed] = useState(product?.days_already_used.toString() || "0");
  const [description, setDescription] = useState(product?.description || "");
  const [storageCondition, setStorageCondition] = useState(
    product?.storage_condition || "refrigerated"
  );
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(product?.image_url || null);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      toast.error("Invalid image format. Use JPEG, PNG, GIF, or WebP");
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload image to server
  const uploadImage = async () => {
    if (!imageFile) return uploadedImageUrl;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await productsApi.uploadImage(formData);
      const imageUrl = response.data.image_url;
      setUploadedImageUrl(imageUrl);
      toast.success("Image uploaded successfully");
      return imageUrl;
    } catch (error: any) {
      console.error("Image upload failed:", error);
      toast.error(error.response?.data?.message || "Failed to upload image");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedType) {
      newErrors.productType = "Product type is required";
    }

    if (!price || parseFloat(price) <= 0) {
      newErrors.price = "Valid price is required";
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      newErrors.quantity = "Valid quantity is required";
    }

    const daysUsedNum = parseInt(daysUsed);
    if (isNaN(daysUsedNum) || daysUsedNum < 0) {
      newErrors.daysUsed = "Valid days used is required";
    }

    if (selectedType && daysUsedNum >= selectedType.default_shelf_life_days) {
      newErrors.daysUsed = `Days used must be less than shelf life (${selectedType.default_shelf_life_days} days)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix form errors");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image if new one selected
      const finalImageUrl = imageFile ? await uploadImage() : uploadedImageUrl;

      // Prepare product data
      const productData = {
        product_type_id: selectedType!.id,
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        unit,
        days_already_used: parseInt(daysUsed),
        description: description.trim() || undefined,
        storage_condition: storageCondition,
        image_url: finalImageUrl || undefined,
      };

      // Create or update product
      if (isEdit && product) {
        await productsApi.update(product.id, productData);
        toast.success("Product updated successfully");
      } else {
        await productsApi.create(productData);
        toast.success("Product created successfully");
      }

      // Redirect to products list
      router.push("/products");
    } catch (error: any) {
      console.error("Failed to save product:", error);
      toast.error(error.response?.data?.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Type */}
      <div>
        <Label htmlFor="productType">
          Product Type <span className="text-red-500">*</span>
        </Label>
        <ProductTypeCombobox
          value={selectedType?.id || product?.product_type_id}
          onSelect={(type) => {
            setSelectedType(type);
            setErrors({ ...errors, productType: "" });
          }}
          disabled={isSubmitting}
        />
        {errors.productType && (
          <p className="mt-1 text-sm text-red-600">{errors.productType}</p>
        )}
        {selectedType && (
          <p className="mt-1 text-sm text-muted-foreground">
            Default shelf life: {selectedType.default_shelf_life_days} days • Storage: {selectedType.default_storage_condition}
          </p>
        )}
      </div>

      {/* Price & Quantity */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="price">
            Price (₱) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              setErrors({ ...errors, price: "" });
            }}
            placeholder="0.00"
            disabled={isSubmitting}
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price}</p>
          )}
        </div>

        <div>
          <Label htmlFor="quantity">
            Quantity <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setErrors({ ...errors, quantity: "" });
              }}
              placeholder="0"
              className="flex-1"
              disabled={isSubmitting}
            />
            <Select value={unit} onValueChange={setUnit} disabled={isSubmitting}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
          )}
        </div>
      </div>

      {/* Days Already Used */}
      <div>
        <Label htmlFor="daysUsed">
          Days Already Used <span className="text-red-500">*</span>
        </Label>
        <Input
          id="daysUsed"
          type="number"
          min="0"
          value={daysUsed}
          onChange={(e) => {
            setDaysUsed(e.target.value);
            setErrors({ ...errors, daysUsed: "" });
          }}
          placeholder="0"
          disabled={isSubmitting}
        />
        {errors.daysUsed && (
          <p className="mt-1 text-sm text-red-600">{errors.daysUsed}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          How many days has this product been stored/aged?
        </p>
      </div>

      {/* Storage Condition */}
      <div>
        <Label htmlFor="storageCondition">Storage Condition</Label>
        <Select
          value={storageCondition}
          onValueChange={setStorageCondition}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STORAGE_CONDITIONS.map((condition) => (
              <SelectItem key={condition.value} value={condition.value}>
                {condition.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Image Upload */}
      <div>
        <Label htmlFor="image">Product Image</Label>
        <div className="mt-2 space-y-3">
          {imagePreview && (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Product preview"
                className="h-32 w-32 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  setUploadedImageUrl(null);
                }}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Input
            id="image"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleImageChange}
            disabled={isSubmitting || isUploading}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            Max 5MB. Formats: JPEG, PNG, GIF, WebP
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="Additional details about your product..."
          rows={4}
          disabled={isSubmitting}
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting || isUploading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="bg-[var(--fresh-primary)] hover:bg-[var(--fresh-primary)]/90"
        >
          {(isSubmitting || isUploading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEdit ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
