"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { STORAGE_CONDITIONS } from "@/lib/types/profile";

interface StoragePreferenceProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function StoragePreference({ value, onChange }: StoragePreferenceProps) {
  const handleToggle = (condition: string, checked: boolean) => {
    if (checked) {
      onChange([...value, condition]);
    } else {
      onChange(value.filter((c) => c !== condition));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Storage Conditions</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Select storage types you can accommodate
        </p>
      </div>
      <div className="space-y-3">
        {STORAGE_CONDITIONS.map((condition) => (
          <div
            key={condition.value}
            className="flex items-center space-x-3 p-3 rounded-lg border"
          >
            <Checkbox
              id={condition.value}
              checked={value.includes(condition.value)}
              onCheckedChange={(checked) =>
                handleToggle(condition.value, checked as boolean)
              }
            />
            <Label
              htmlFor={condition.value}
              className="flex-1 font-normal cursor-pointer"
            >
              {condition.label}
            </Label>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length === 0
          ? "No storage conditions selected – all products will be shown"
          : `${value.length} condition${value.length > 1 ? "s" : ""} selected`}
      </p>
    </div>
  );
}
