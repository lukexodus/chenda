"use client";

import { useState } from "react";
import { Search, MapPin, Sliders, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { useSearchStore } from "@/lib/stores/searchStore";
import { useAuthStore } from "@/lib/store";
import { usersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [geocoding, setGeocoding] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle geocoding
  const handleGeocodeAddress = async () => {
    if (!addressInput.trim()) {
      toast.error("Please enter an address");
      return;
    }

    setGeocoding(true);
    try {
      const response = await usersApi.geocode(addressInput);
      const { lat, lng, display_name } = response.data;

      setLocation(lat, lng, display_name || addressInput);
      setAddressInput(display_name || addressInput);

      toast.success("Location set successfully");
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to find location. Please try again.");
    } finally {
      setGeocoding(false);
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

  // Use browser geolocation
  const handleBrowserGeolocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          try {
            const response = await usersApi.reverseGeocode(
              latitude,
              longitude
            );
            const address = response.data.address || "Current Location";
            
            setLocation(latitude, longitude, address);
            setAddressInput(address);
            toast.success("Using your current location");
          } catch (error) {
            console.error("Reverse geocoding error:", error);
            setLocation(latitude, longitude, "Current Location");
            setAddressInput("Current Location");
            toast.success("Location set (address not found)");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Failed to get your location. Please enable location services.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
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
          <div className="mt-2 flex gap-2">
            <div className="flex-1">
              <Input
                id="location"
                type="text"
                placeholder="Enter address or city"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleGeocodeAddress()}
                disabled={geocoding || loading}
                className="w-full"
              />
            </div>
            <Button
              type="button"
              onClick={handleGeocodeAddress}
              disabled={geocoding || loading || !addressInput.trim()}
              variant="secondary"
            >
              {geocoding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Quick Location Buttons */}
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={!user?.location || loading}
              className="text-xs"
            >
              <MapPin className="mr-1 h-3 w-3" />
              My Saved Location
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBrowserGeolocation}
              disabled={loading}
              className="text-xs"
            >
              <MapPin className="mr-1 h-3 w-3" />
              Use Current Location
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
