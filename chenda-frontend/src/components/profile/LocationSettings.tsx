"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AddressAutocomplete from "@/components/maps/AddressAutocomplete";
import GeolocationButton from "@/components/maps/GeolocationButton";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Leaflet
const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface DraggableMarkerProps {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
}

function DraggableMarker({ position, onPositionChange }: DraggableMarkerProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(position);

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setMarkerPosition([lat, lng]);
      onPositionChange(lat, lng);
      map.panTo(e.latlng);
    },
  });

  return (
    <Marker
      position={markerPosition}
      icon={defaultIcon}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const position = marker.getLatLng();
          setMarkerPosition([position.lat, position.lng]);
          onPositionChange(position.lat, position.lng);
        },
      }}
    />
  );
}

export function LocationSettings() {
  const { user, updateLocation } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number]>([
    14.5995, 120.9842, // Default: Manila, Philippines
  ]);

  // Initialize with user's location
  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
    }
    if (user?.location) {
      setCoordinates([user.location.lat, user.location.lng]);
    }
  }, [user]);

  const handleAddressSelect = (lat: number, lng: number, selectedAddress: string) => {
    setAddress(selectedAddress);
    setCoordinates([lat, lng]);
  };

  const handleGeolocation = (lat: number, lng: number, address?: string) => {
    setCoordinates([lat, lng]);
    if (address) {
      setAddress(address);
    }
  };

  const handleMarkerMove = (lat: number, lng: number) => {
    setCoordinates([lat, lng]);
  };

  const handleSaveLocation = async () => {
    if (!address.trim()) {
      toast.error("Validation Error", {
        description: "Please enter an address",
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateLocation(coordinates[0], coordinates[1], address);
      
      toast.success("Location saved", {
        description: "Your location has been updated successfully",
      });
    } catch (error: any) {
      console.error("Failed to save location:", error);
      toast.error("Failed to save location", {
        description: error.response?.data?.message || "Please try again later",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Settings</CardTitle>
        <CardDescription>
          Set your location to find nearby fresh products
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Address Display */}
        <div className="space-y-2">
          <Label>Current Address</Label>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm">
              {user?.address || "No address set"}
            </span>
          </div>
        </div>

        {/* Address Search */}
        <div className="space-y-2">
          <Label htmlFor="address-search">Search Address</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onSelect={handleAddressSelect}
                placeholder="Search for an address..."
              />
            </div>
            <GeolocationButton onLocationFound={handleGeolocation} />
          </div>
          <p className="text-sm text-muted-foreground">
            Search for an address or use your current location
          </p>
        </div>

        {/* Interactive Map */}
        <div className="space-y-2">
          <Label>Confirm Location on Map</Label>
          <div className="rounded-lg overflow-hidden border">
            <MapContainer
              center={coordinates}
              zoom={15}
              scrollWheelZoom={true}
              style={{ height: "400px", width: "100%" }}
              key={`${coordinates[0]}-${coordinates[1]}`} // Force re-render on coordinate change
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DraggableMarker
                position={coordinates}
                onPositionChange={handleMarkerMove}
              />
            </MapContainer>
          </div>
          <p className="text-sm text-muted-foreground">
            Click on the map or drag the marker to adjust your location
          </p>
        </div>

        {/* Coordinates Display */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">Latitude</Label>
            <p className="font-mono mt-1">{coordinates[0].toFixed(6)}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Longitude</Label>
            <p className="font-mono mt-1">{coordinates[1].toFixed(6)}</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveLocation} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Location
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
