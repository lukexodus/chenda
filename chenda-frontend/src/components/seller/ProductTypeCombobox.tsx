"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { productTypesApi } from "@/lib/api";
import type { ProductType } from "@/lib/types/seller";
import { cn } from "@/lib/utils";

interface ProductTypeComboboxProps {
  value?: number;
  onSelect: (productType: ProductType) => void;
  disabled?: boolean;
}

export function ProductTypeCombobox({ value, onSelect, disabled }: ProductTypeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);

  // Fetch all product types on mount
  useEffect(() => {
    async function fetchProductTypes() {
      try {
        setIsLoading(true);
        const response = await productTypesApi.getAll();
        const types = response.data.product_types || [];
        setProductTypes(types);
        setFilteredTypes(types);

        // If value is provided, find and set the selected type
        if (value) {
          const selected = types.find((t: ProductType) => t.id === value);
          if (selected) setSelectedType(selected);
        }
      } catch (error) {
        console.error("Failed to fetch product types:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProductTypes();
  }, [value]);

  // Filter product types based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredTypes(productTypes);
      return;
    }

    const searchLower = search.toLowerCase();
    const filtered = productTypes.filter((type) => {
      const nameMatch = type.name.toLowerCase().includes(searchLower);
      const subtitleMatch = type.name_subtitle?.toLowerCase().includes(searchLower);
      const keywordsMatch = type.keywords?.toLowerCase().includes(searchLower);
      return nameMatch || subtitleMatch || keywordsMatch;
    });

    setFilteredTypes(filtered);
  }, [search, productTypes]);

  const handleSelect = (productType: ProductType) => {
    setSelectedType(productType);
    onSelect(productType);
    setOpen(false);
    setSearch("");
  };

  const displayText = selectedType
    ? `${selectedType.name}${selectedType.name_subtitle ? ` - ${selectedType.name_subtitle}` : ""}`
    : "Select product type...";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Select Product Type</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search product types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>
        </div>

        {/* Product Types List */}
        <div className="max-h-[400px] overflow-y-auto px-2 pb-2">
          {isLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading product types...
            </div>
          )}

          {!isLoading && filteredTypes.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No product types found.
            </div>
          )}

          {!isLoading && filteredTypes.length > 0 && (
            <div className="space-y-1">
              {filteredTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleSelect(type)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                    selectedType?.id === type.id && "bg-accent"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{type.name}</div>
                      {type.name_subtitle && (
                        <div className="text-xs text-muted-foreground">
                          {type.name_subtitle}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">
                        Shelf life: {type.default_shelf_life_days} days • {type.default_storage_condition}
                      </div>
                    </div>
                    {selectedType?.id === type.id && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
