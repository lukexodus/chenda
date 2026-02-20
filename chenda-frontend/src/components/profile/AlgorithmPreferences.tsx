"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { Loader2, Info } from "lucide-react";
import { StoragePreference } from "./StoragePreference";
import { WEIGHT_PRESETS } from "@/lib/types/profile";

export function AlgorithmPreferences() {
  const { user, updatePreferences } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [proximityWeight, setProximityWeight] = useState(50);
  const [freshnessWeight, setFreshnessWeight] = useState(50);
  const [maxRadius, setMaxRadius] = useState(30);
  const [minFreshness, setMinFreshness] = useState(50);
  const [displayMode, setDisplayMode] = useState<"ranking" | "filter">("ranking");
  const [storageConditions, setStorageConditions] = useState<string[]>([]);

  // Initialize with user's preferences
  useEffect(() => {
    if (user?.preferences) {
      const prefs = user.preferences;
      setProximityWeight(prefs.proximity_weight || 50);
      setFreshnessWeight(prefs.freshness_weight || 50);
      setMaxRadius(prefs.max_radius || 30);
      setMinFreshness(prefs.min_freshness_score || 50);
      setDisplayMode((prefs as any).display_mode || "ranking");
      
      // Parse storage conditions if stored as string
      if (prefs.storage_condition) {
        const conditions = typeof prefs.storage_condition === 'string' 
          ? prefs.storage_condition.split(',') 
          : [prefs.storage_condition];
        setStorageConditions(conditions);
      }
    }
  }, [user]);

  // Handle weight changes with automatic balancing
  const handleProximityWeightChange = (value: number[]) => {
    const newProximity = value[0];
    setProximityWeight(newProximity);
    setFreshnessWeight(100 - newProximity);
    setSelectedPreset(""); // Clear preset selection
  };

  const handleFreshnessWeightChange = (value: number[]) => {
    const newFreshness = value[0];
    setFreshnessWeight(newFreshness);
    setProximityWeight(100 - newFreshness);
    setSelectedPreset(""); // Clear preset selection
  };

  // Handle preset selection
  const handlePresetSelect = (presetId: string) => {
    const preset = WEIGHT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setProximityWeight(preset.proximity_weight);
      setFreshnessWeight(preset.freshness_weight);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const preferencesData = {
        proximity_weight: proximityWeight,
        freshness_weight: freshnessWeight,
        max_radius: maxRadius,
        min_freshness_score: minFreshness,
        display_mode: displayMode,
        storage_condition: storageConditions.join(','),
      };

      await updatePreferences(preferencesData);
      
      toast.success("Preferences saved", {
        description: "Your algorithm preferences have been updated",
      });
    } catch (error: any) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save preferences", {
        description: error.response?.data?.message || "Please try again later",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check if user is buyer or both (algorithm preferences only for buyers)
  if (!user || (user.type !== "buyer" && user.type !== "both")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Algorithm Preferences</CardTitle>
          <CardDescription>
            Customize how products are ranked and filtered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Not available for sellers</p>
              <p className="text-sm text-muted-foreground mt-1">
                Algorithm preferences are only available for buyer accounts. 
                Change your account type to "Buyer" or "Both" to access these settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Algorithm Preferences</CardTitle>
        <CardDescription>
          Customize how products are ranked and filtered based on your priorities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Weight Presets */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Quick Presets</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a preset or customize weights manually
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {WEIGHT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedPreset === preset.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-semibold text-sm">{preset.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {preset.description}
                </p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-primary">
                    📍 {preset.proximity_weight}%
                  </span>
                  <span className="text-green-600">
                    🌿 {preset.freshness_weight}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Weight Sliders */}
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold">Custom Weights</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust weights manually (must sum to 100%)
            </p>
          </div>

          {/* Proximity Weight */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="proximity-weight">Proximity Weight</Label>
              <span className="text-sm font-semibold text-primary">
                {proximityWeight}%
              </span>
            </div>
            <Slider
              id="proximity-weight"
              min={0}
              max={100}
              step={5}
              value={[proximityWeight]}
              onValueChange={handleProximityWeightChange}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher values prioritize nearby products
            </p>
          </div>

          {/* Freshness Weight */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="freshness-weight">Freshness Weight</Label>
              <span className="text-sm font-semibold text-green-600">
                {freshnessWeight}%
              </span>
            </div>
            <Slider
              id="freshness-weight"
              min={0}
              max={100}
              step={5}
              value={[freshnessWeight]}
              onValueChange={handleFreshnessWeightChange}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher values prioritize fresher products
            </p>
          </div>
        </div>

        {/* Default Filters */}
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold">Default Filters</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Set default search parameters
            </p>
          </div>

          {/* Max Radius */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-radius">Maximum Search Radius</Label>
              <span className="text-sm font-semibold">{maxRadius} km</span>
            </div>
            <Slider
              id="max-radius"
              min={10}
              max={100}
              step={5}
              value={[maxRadius]}
              onValueChange={(value) => setMaxRadius(value[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Only show products within this distance
            </p>
          </div>

          {/* Min Freshness */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="min-freshness">Minimum Freshness Score</Label>
              <span className="text-sm font-semibold">{minFreshness}%</span>
            </div>
            <Slider
              id="min-freshness"
              min={0}
              max={100}
              step={5}
              value={[minFreshness]}
              onValueChange={(value) => setMinFreshness(value[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Filter out products below this freshness level
            </p>
          </div>
        </div>

        {/* Storage Preference */}
        <StoragePreference
          value={storageConditions}
          onChange={setStorageConditions}
        />

        {/* Display Mode */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Display Mode</Label>
            <p className="text-sm text-muted-foreground mt-1">
              How results are displayed
            </p>
          </div>
          <RadioGroup value={displayMode} onValueChange={(value: any) => setDisplayMode(value)}>
            <div className="flex items-start space-x-3 p-4 rounded-lg border">
              <RadioGroupItem value="ranking" id="ranking" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="ranking" className="font-medium cursor-pointer">
                  Ranking Mode
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Show all products ranked by score, even if they don't meet
                  your minimum criteria
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 rounded-lg border">
              <RadioGroupItem value="filter" id="filter" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="filter" className="font-medium cursor-pointer">
                  Filter Mode
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Only show products that meet your minimum radius and
                  freshness requirements
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
