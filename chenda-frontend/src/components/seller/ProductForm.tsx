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
  { value: "pantry", label: "Room Temperature (Pantry)" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "frozen", label: "Frozen" },
];

const UNITS = ["kg", "g", "lb", "oz", "pcs", "dozen", "bundle"];

function getFullImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  // Relative /uploads/ paths are proxied by Next.js to the backend
  return imageUrl;
}

export function ProductForm({ product, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // Normalize storage condition from old "room_temp" to "pantry"
  const normalizeStorageCondition = (condition?: string) => {
    if (condition === "room_temp") return "pantry";
    if (!condition) return "pantry";
    return condition;
  };

  // ── Catalog-type mode (Path A) ───────────────────────────────────────────
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);

  // ── Custom-product mode (Path B) ─────────────────────────────────────────
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [sellerShelfLife, setSellerShelfLife] = useState(
    product?.seller_shelf_life_days?.toString() || product?.total_shelf_life_days?.toString() || ""
  );

  const [price, setPrice] = useState(product?.price.toString() || "");
  const [quantity, setQuantity] = useState(product?.quantity.toString() || "");
  const [unit, setUnit] = useState(product?.unit || "kg");
  const [daysUsed, setDaysUsed] = useState(product?.days_already_used.toString() || "0");
  const [description, setDescription] = useState(product?.description || "");
  const [storageCondition, setStorageCondition] = useState(
    normalizeStorageCondition(product?.storage_condition)
  );

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(getFullImageUrl(product?.image_url));
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(product?.image_url || null);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Effective shelf life for freshness preview: seller-entered (authoritative)
  const effectiveShelfLife = parseInt(sellerShelfLife) || 0;

  const getSimpleStorageLabel = (condition?: string | null) => {
    if (!condition) return "—";
    if (condition.startsWith("pantry")) return "Pantry";
    if (condition.startsWith("refrigerated")) return "Refrigerated";
    if (condition.startsWith("frozen")) return "Frozen";
    return condition;
  };

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
      const imageUrl = response.data.data.url;
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

    const shelfLifeNum = parseInt(sellerShelfLife);
    if (isNaN(shelfLifeNum) || shelfLifeNum < 1) {
      newErrors.sellerShelfLife = "Shelf life must be at least 1 day";
    }

    const daysUsedNum = parseInt(daysUsed);
    if (isNaN(daysUsedNum) || daysUsedNum < 0) {
      newErrors.daysUsed = "Valid days used is required";
    }

    if (isCustomMode) {
      if (!customName.trim()) {
        newErrors.productType = "Product name is required";
      }
      if (!newErrors.sellerShelfLife && !newErrors.daysUsed && daysUsedNum >= shelfLifeNum) {
        newErrors.daysUsed = `Days used must be less than shelf life (${shelfLifeNum} days)`;
      }
    } else {
      if (!selectedType) {
        newErrors.productType = "Product type is required";
      }
      if (!newErrors.sellerShelfLife && !newErrors.daysUsed && daysUsedNum >= shelfLifeNum) {
        newErrors.daysUsed = `Days used must be less than shelf life (${shelfLifeNum} days)`;
      }
    }

    if (!price || parseFloat(price) <= 0) {
      newErrors.price = "Valid price is required";
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      newErrors.quantity = "Valid quantity is required";
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

    // For new products, location is required
    if (!isEdit && (!user?.location?.lat || !user?.location?.lng)) {
      toast.error("Please set your location in Profile → Location before creating products");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image if new one selected
      const finalImageUrl = imageFile ? await uploadImage() : uploadedImageUrl;

      // Prepare product data — branch on custom vs catalog path
      const commonFields: Record<string, unknown> = {
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        unit,
        days_already_used: parseInt(daysUsed),
        seller_shelf_life_days: parseInt(sellerShelfLife),
        description: description.trim() || undefined,
        storage_condition: storageCondition,
        image_url: finalImageUrl || undefined,
        address: user?.address || undefined,
      };

      const productData: Record<string, unknown> = isCustomMode
        ? {
            ...commonFields,
            custom_product_name: customName.trim(),
            // Optional: seed the shared custom type's initial reference shelf life
            custom_shelf_life_days: parseInt(sellerShelfLife),
          }
        : {
            ...commonFields,
            product_type_id: selectedType!.id,
          };

      // Only include location if the user has GPS coordinates
      if (user?.location?.lat && user?.location?.lng) {
        productData.location = {
          lat: user.location.lat,
          lng: user.location.lng,
        };
      }

      // Create or update product
      if (isEdit && product) {
        await productsApi.update(product.id, productData);
        toast.success("Product updated successfully");
      } else {
        await productsApi.create(productData);
        toast.success("Product created successfully");
      }

      // Redirect to products list
      router.push("/seller/products");
    } catch (error: any) {
      console.error("Failed to save product:", error);
      toast.error(error.response?.data?.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute live freshness preview (works for both catalog and custom modes)
  const freshnessPercent =
    effectiveShelfLife > 0
      ? Math.max(
          0,
          Math.min(
            100,
            ((effectiveShelfLife - parseInt(daysUsed || "0")) / effectiveShelfLife) * 100
          )
        )
      : null;

  const freshnessColor =
    freshnessPercent === null
      ? ""
      : freshnessPercent >= 70
      ? "bg-green-500"
      : freshnessPercent >= 30
      ? "bg-yellow-400"
      : "bg-red-500";

  const freshnessLabel =
    freshnessPercent === null
      ? ""
      : freshnessPercent >= 70
      ? "Fresh"
      : freshnessPercent >= 30
      ? "Use Soon"
      : "Critical";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Page Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--fresh-border,#E5E7EB)] bg-white text-[var(--fresh-text-muted)] transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-[var(--fresh-text-primary)]">
            {isEdit ? "Edit Product" : "Add Product"}
          </h1>
          <p className="text-sm text-[var(--fresh-text-muted)]">
            {isEdit ? "Update your listing details" : "Create a new listing for buyers"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Section: Product Details ── */}
        <div className="rounded-[var(--radius-card)] border border-[var(--fresh-border,#E5E7EB)] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--fresh-text-muted)]">
            Product Details
          </h2>
          <div className="space-y-4">
            {/* Product Type */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="productType" className="text-sm font-medium">
                  Product Type <span className="text-red-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode((v) => !v);
                    setSelectedType(null);
                    setCustomName("");
                    setSellerShelfLife("");
                    setErrors({ ...errors, productType: "", sellerShelfLife: "" });
                  }}
                  disabled={isSubmitting || isEdit}
                  className="text-xs text-[var(--fresh-primary)] underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-40"
                >
                  {isCustomMode ? "← Search catalog" : "Not in the list? Add custom →"}
                </button>
              </div>

              {isCustomMode ? (
                <div className="space-y-2">
                  <input
                    id="customName"
                    type="text"
                    value={customName}
                    onChange={(e) => {
                      setCustomName(e.target.value);
                      setErrors({ ...errors, productType: "" });
                    }}
                    placeholder="e.g. Dayap Citrus, Salted Duck Egg"
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-[var(--fresh-border,#E5E7EB)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--fresh-primary)]"
                  />
                  <p className="text-xs text-[var(--fresh-text-muted)]">
                    No USDA reference available for custom products. Your shelf life helps build the community reference over time.
                  </p>
                </div>
              ) : (
                <ProductTypeCombobox
                  value={selectedType?.id || product?.product_type_id}
                  onSelect={(type) => {
                    setSelectedType(type);
                    setErrors({ ...errors, productType: "" });
                    if (!isEdit) {
                      setSellerShelfLife((prev) =>
                        prev && parseInt(prev) > 0 ? prev : `${type.default_shelf_life_days}`
                      );
                    }
                    // Pre-fill the listing image from the type's canonical photo
                    // if the seller hasn't already uploaded their own image
                    if (type.image_url && !imageFile && !uploadedImageUrl) {
                      setImagePreview(type.image_url);
                      setUploadedImageUrl(type.image_url);
                    }
                  }}
                  disabled={isSubmitting}
                />
              )}

              {errors.productType && (
                <p className="text-xs text-red-500">{errors.productType}</p>
              )}
              {!isCustomMode && selectedType && (
                <p className="text-xs text-[var(--fresh-text-muted)]">
                  {selectedType.source === "usda" ? (
                    <>
                      <span className="font-semibold text-[var(--fresh-primary)]">USDA reference available</span>
                      {" · "}reference: <span className="font-medium">{selectedType.default_shelf_life_days} days</span>
                      {" · "}USDA storage:{" "}
                      <span className="font-medium">{getSimpleStorageLabel(selectedType.default_storage_condition)}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">No USDA reference available</span>
                      {" · "}set shelf life based on your actual handling/storage
                    </>
                  )}
                  {selectedType.community_avg_shelf_life_days != null && (
                    <span className="ml-1 text-[var(--fresh-primary)]">
                      · community avg: {Math.round(selectedType.community_avg_shelf_life_days)} days
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Shelf Life */}
            <div className="space-y-1.5">
              <Label htmlFor="sellerShelfLife" className="text-sm font-medium">
                Shelf Life (days) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sellerShelfLife"
                type="number"
                min="1"
                value={sellerShelfLife}
                onChange={(e) => {
                  setSellerShelfLife(e.target.value);
                  setErrors({ ...errors, sellerShelfLife: "" });
                }}
                placeholder="e.g. 7"
                disabled={isSubmitting}
                className="text-sm"
              />
              {errors.sellerShelfLife ? (
                <p className="text-xs text-red-500">{errors.sellerShelfLife}</p>
              ) : (
                <p className="text-xs text-[var(--fresh-text-muted)]">
                  You decide the shelf life for this listing. USDA values (when available) are reference only.
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Describe your product — variety, origin, condition..."
                rows={3}
                disabled={isSubmitting}
                className="resize-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* ── Section: Pricing & Quantity ── */}
        <div className="rounded-[var(--radius-card)] border border-[var(--fresh-border,#E5E7EB)] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--fresh-text-muted)]">
            Pricing & Quantity
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-sm font-medium">
                Price (₱) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fresh-text-muted)]">
                  ₱
                </span>
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
                  className="pl-7 text-sm"
                />
              </div>
              {errors.price && (
                <p className="text-xs text-red-500">{errors.price}</p>
              )}
            </div>

            {/* Quantity + Unit */}
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-sm font-medium">
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
                  disabled={isSubmitting}
                  className="min-w-0 flex-1 text-sm"
                />
                <Select value={unit} onValueChange={setUnit} disabled={isSubmitting}>
                  <SelectTrigger className="w-20 shrink-0 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u} className="text-sm">
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.quantity && (
                <p className="text-xs text-red-500">{errors.quantity}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Section: Freshness ── */}
        <div className="rounded-[var(--radius-card)] border border-[var(--fresh-border,#E5E7EB)] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--fresh-text-muted)]">
            Freshness & Storage
          </h2>
          <div className="space-y-4">
            {/* Days Used */}
            <div className="space-y-1.5">
              <Label htmlFor="daysUsed" className="text-sm font-medium">
                Days Since Harvest <span className="text-red-500">*</span>
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
                className="text-sm"
              />
              {errors.daysUsed ? (
                <p className="text-xs text-red-500">{errors.daysUsed}</p>
              ) : (
                <p className="text-xs text-[var(--fresh-text-muted)]">
                  How many days has this product been stored or aged already?
                </p>
              )}
            </div>

            {/* Freshness Preview Bar */}
            {freshnessPercent !== null && (
              <div className="space-y-1.5 rounded-lg bg-gray-50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--fresh-text-muted)]">Freshness Preview</span>
                  <span
                    className={`font-semibold ${
                      freshnessPercent >= 70
                        ? "text-green-600"
                        : freshnessPercent >= 30
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {freshnessLabel} · {Math.round(freshnessPercent)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full transition-all ${freshnessColor}`}
                    style={{ width: `${freshnessPercent}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--fresh-text-muted)]">
                  {Math.max(0, effectiveShelfLife - parseInt(daysUsed || "0"))}{" "}
                  days remaining out of {effectiveShelfLife}
                </p>
              </div>
            )}

            {/* Storage Condition */}
            <div className="space-y-1.5">
              <Label htmlFor="storageCondition" className="text-sm font-medium">
                Storage Condition
              </Label>
              <Select
                value={storageCondition}
                onValueChange={setStorageCondition}
                disabled={isSubmitting}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STORAGE_CONDITIONS.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value} className="text-sm">
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── Section: Photo ── */}
        <div className="rounded-[var(--radius-card)] border border-[var(--fresh-border,#E5E7EB)] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--fresh-text-muted)]">
            Photo
          </h2>

          {imagePreview ? (
            <div className="flex items-start gap-4">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="h-24 w-24 rounded-xl object-cover ring-1 ring-[var(--fresh-border,#E5E7EB)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    setUploadedImageUrl(null);
                  }}
                  disabled={isSubmitting}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--fresh-text-primary)]">Photo added</p>
                <p className="mt-0.5 text-xs text-[var(--fresh-text-muted)]">
                  Click × to remove and upload a different photo
                </p>
              </div>
            </div>
          ) : (
            <label
              htmlFor="image"
              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--fresh-border,#E5E7EB)] bg-gray-50 px-6 py-8 transition hover:border-[var(--fresh-primary)] hover:bg-green-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Upload className="h-5 w-5 text-[var(--fresh-text-muted)]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--fresh-text-primary)]">
                  Upload a photo
                </p>
                <p className="mt-0.5 text-xs text-[var(--fresh-text-muted)]">
                  JPEG, PNG, WebP up to 5 MB
                </p>
              </div>
              <input
                id="image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                disabled={isSubmitting || isUploading}
                className="sr-only"
              />
            </label>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting || isUploading}
            className="min-w-[88px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="min-w-[140px] bg-[var(--fresh-primary)] text-white hover:bg-[var(--fresh-primary)]/90"
          >
            {(isSubmitting || isUploading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEdit ? "Save Changes" : "List Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
