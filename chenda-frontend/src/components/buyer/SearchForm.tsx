"use client";

import { useState } from "react";
import { Search, Sliders, ChevronDown, ChevronUp, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useSearchStore } from "@/lib/stores/searchStore";
import { useAuthStore } from "@/lib/store";
import { usersApi } from "@/lib/api";
import AddressAutocomplete from "@/components/maps/AddressAutocomplete";
import GeolocationButton from "@/components/maps/GeolocationButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

export function SearchForm() {
  const { user } = useAuthStore();
  const {
    filters,
    setLocation,
    setProximityWeight,
    setFreshnessWeight,
    setFilters,
    search,
    loading,
  } = useSearchStore();

  const [addressInput, setAddressInput] = useState(
    filters.location?.address || ""
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle address selection from autocomplete
  const handleAddressSelect = (lat: number, lng: number, address: string) => {
    setLocation(lat, lng, address);
    toast.success("Location set successfully");
  };

  // Handle geolocation
  const handleGeolocationFound = async (lat: number, lng: number) => {
    try {
      const response = await usersApi.reverseGeocode(lat, lng);
      const address = response.data.address || "Current Location";
      
      setLocation(lat, lng, address);
      setAddressInput(address);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setLocation(lat, lng, "Current Location");
      setAddressInput("Current Location");
    }
  };

  // Use user's saved location
  const handleUseMyLocation = () => {
    if (user?.location) {
      setLocation(user.location.lat, user.location.lng, user.address);
      setAddressInput(user.address || "");
      toast.success("Using your saved location");
    } else {
      toast.error("No saved location found. Please set your location in your profile.");
    }
  };

  // Handle search
  const handleSearch = () => {
    if (!filters.location) {
      toast.error("Please set your location first");
      return;
    }
    search();
  };

  return (
    <Card className="p-4 sm:p-6 border-[var(--fresh-border)] shadow-[var(--shadow-small)]">
      {/* Location Input */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="location" className="text-sm font-medium">
            Your Location
          </Label>
          <div className="mt-2">
            <AddressAutocomplete
              value={addressInput}
              onChange={setAddressInput}
              onSelect={handleAddressSelect}
              placeholder="Enter address or city..."
            />
          </div>

          {/* Quick Location Buttons */}
          <div className="mt-2 flex gap-2">
            <GeolocationButton
              onLocationFound={handleGeolocationFound}
              size="sm"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={!user?.location || loading}
              className="flex-1"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Saved Location
            </Button>
          </div>

          {filters.location && (
            <p className="mt-2 text-xs text-[var(--fresh-text-muted)]">
              📍 {filters.location.address || "Location set"}
            </p>
          )}
        </div>

        {/* Weight Sliders */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Proximity Weight */}
          <div>
            <Label htmlFor="proximity-slider" className="text-sm font-medium">
              Proximity Weight: {filters.proximityWeight}%
            </Label>
            <Slider
              id="proximity-slider"
              value={[filters.proximityWeight]}
              onValueChange={([value]) => setProximityWeight(value)}
              max={100}
              step={5}
              disabled={loading}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-[var(--fresh-text-muted)]">
              Prioritize nearby products
            </p>
          </div>

          {/* Freshness Weight */}
          <div>
            <Label htmlFor="freshness-slider" className="text-sm font-medium">
              Freshness Weight: {filters.freshnessWeight}%
            </Label>
            <Slider
              id="freshness-slider"
              value={[filters.freshnessWeight]}
              onValueChange={([value]) => setFreshnessWeight(value)}
              max={100}
              step={5}
              disabled={loading}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-[var(--fresh-text-muted)]">
              Prioritize fresher products
            </p>
          </div>
        </div>

        {/* Validation Message */}
        {filters.proximityWeight + filters.freshnessWeight !== 100 && (
          <p className="text-xs text-[var(--fresh-danger)]">
            ⚠️ Weights must sum to 100%
          </p>
        )}

        {/* Advanced Options Toggle */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-sm"
        >
          <Sliders className="mr-2 h-4 w-4" />
          Advanced Options
          {showAdvanced ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4" />
          )}
        </Button>

        {/* Advanced Options Panel */}
        {showAdvanced && (
          <div className="space-y-4 rounded-lg border border-[var(--fresh-border)] bg-[var(--fresh-surface)] p-4">
            {/* Max Radius */}
            <div>
              <Label htmlFor="radius-slider" className="text-sm font-medium">
                Max Search Radius: {filters.maxRadius} km
              </Label>
              <Slider
                id="radius-slider"
                value={[filters.maxRadius]}
                onValueChange={([value]) =>
                  setFilters({ maxRadius: value })
                }
                min={5}
                max={100}
                step={5}
                disabled={loading}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-[var(--fresh-text-muted)]">
                Search products within this distance
              </p>
            </div>

            {/* Min Freshness Score */}
            <div>
              <Label htmlFor="freshness-threshold" className="text-sm font-medium">
                Min Freshness Score: {filters.minFreshnessScore}%
              </Label>
              <Slider
                id="freshness-threshold"
                value={[filters.minFreshnessScore]}
                onValueChange={([value]) =>
                  setFilters({ minFreshnessScore: value })
                }
                max={100}
                step={5}
                disabled={loading}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-[var(--fresh-text-muted)]">
                Filter out products below this freshness
              </p>
            </div>
          </div>
        )}

        {/* Search Button */}
        <Button
          type="button"
          onClick={handleSearch}
          disabled={!filters.location || loading}
          className="w-full bg-[var(--fresh-primary)] hover:bg-[var(--fresh-primary)]/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search Fresh Products
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
