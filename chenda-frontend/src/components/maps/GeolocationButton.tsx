"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GeolocationButtonProps {
  onLocationFound: (lat: number, lng: number) => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export default function GeolocationButton({
  onLocationFound,
  variant = "outline",
  size = "default",
  className = "",
  showLabel = true,
}: GeolocationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationFound(latitude, longitude);
        toast.success("Location found successfully");
        setIsLoading(false);
      },
      (error) => {
        let message = "Failed to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable";
            break;
          case error.TIMEOUT:
            message = "Location request timed out";
            break;
        }
        
        toast.error(message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleGetLocation}
      disabled={isLoading}
      className={className}
      title="Use my current location"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MapPin className="h-4 w-4" />
      )}
      {showLabel && (
        <span className="ml-2">
          {isLoading ? "Getting location..." : "Use My Location"}
        </span>
      )}
    </Button>
  );
}
