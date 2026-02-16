"use client";

import { ArrowUpDown, Star, MapPin, DollarSign, Leaf } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export type SortOption =
  | "score"
  | "price_low"
  | "price_high"
  | "distance"
  | "freshness";

interface SortControlsProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  resultCount?: number;
}

const sortOptions = [
  {
    value: "score" as const,
    label: "Algorithm Score",
    icon: Star,
    description: "Best match based on your preferences",
  },
  {
    value: "price_low" as const,
    label: "Price: Low to High",
    icon: DollarSign,
    description: "Cheapest first",
  },
  {
    value: "price_high" as const,
    label: "Price: High to Low",
    icon: DollarSign,
    description: "Most expensive first",
  },
  {
    value: "distance" as const,
    label: "Distance: Nearest First",
    icon: MapPin,
    description: "Closest to you",
  },
  {
    value: "freshness" as const,
    label: "Freshness: Highest First",
    icon: Leaf,
    description: "Freshest products",
  },
];

export function SortControls({
  value,
  onChange,
  resultCount,
}: SortControlsProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-[var(--radius-card)] border border-[var(--fresh-border)] bg-white">
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-5 w-5 text-[var(--fresh-text-muted)]" />
        <Label htmlFor="sort" className="text-sm font-medium whitespace-nowrap">
          Sort by:
        </Label>
      </div>

      <div className="flex items-center gap-4 flex-1">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="sort" className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-[var(--fresh-text-muted)]">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {resultCount !== undefined && (
          <span className="text-sm text-[var(--fresh-text-muted)] whitespace-nowrap">
            {resultCount} {resultCount === 1 ? "result" : "results"}
          </span>
        )}
      </div>
    </div>
  );
}
