/**
 * TypeScript types for user profile and preferences
 */

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  type: "buyer" | "seller" | "both";
  address?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface UserPreferences {
  proximity_weight: number;
  freshness_weight: number;
  default_max_radius: number;
  default_min_freshness: number;
  display_mode: "ranking" | "filter";
  storage_conditions?: string[]; // ["pantry", "refrigerated", "frozen"]
}

export interface ProfileFormData {
  name: string;
  type: "buyer" | "seller" | "both";
}

export interface LocationUpdateData {
  address: string;
  latitude: number;
  longitude: number;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface WeightPreset {
  id: string;
  name: string;
  proximity_weight: number;
  freshness_weight: number;
  description: string;
}

export const WEIGHT_PRESETS: WeightPreset[] = [
  {
    id: "balanced",
    name: "Balanced",
    proximity_weight: 50,
    freshness_weight: 50,
    description: "Equal priority for distance and freshness",
  },
  {
    id: "proximity",
    name: "Proximity First",
    proximity_weight: 70,
    freshness_weight: 30,
    description: "Prefer nearby products",
  },
  {
    id: "freshness",
    name: "Freshness First",
    proximity_weight: 30,
    freshness_weight: 70,
    description: "Prefer fresher products",
  },
];

export const STORAGE_CONDITIONS = [
  { value: "pantry", label: "Pantry (Room Temperature)" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "frozen", label: "Frozen" },
] as const;
