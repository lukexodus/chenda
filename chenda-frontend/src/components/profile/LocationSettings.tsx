"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AddressAutocomplete from "@/components/maps/AddressAutocomplete";
import GeolocationButton from "@/components/maps/GeolocationButton";
import { useAuthStore } from "@/lib/store";
import { usersApi } from "@/lib/api";
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
  // address = the value that gets saved (shown in "Current Address" and sent to API)
  const [address, setAddress] = useState(user?.address ?? "");
  // searchInput = only what the user types in the search bar (starts empty — no auto-dropdown)
  const [searchInput, setSearchInput] = useState("");
  // Initialize coordinates directly from the store to avoid a Manila flash
  const [coordinates, setCoordinates] = useState<[number, number]>(() =>
    user?.location ? [user.location.lat, user.location.lng] : [14.5995, 120.9842]
  );

  // If location is missing from the store (stale session before fix),
  // silently fetch the profile and update only the user object — no loading flash.
  useEffect(() => {
    if (user && !user.location) {
      usersApi.getProfile().then((res) => {
        const fresh = res.data.user ?? res.data.data ?? null;
        if (fresh?.location) {
          useAuthStore.setState({ user: { ...user, ...fresh } });
        }
      }).catch(() => {/* silent */});
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // When the user object updates (e.g. after silent fetch), sync coordinates and address
  useEffect(() => {
    if (user?.location) {
      setCoordinates([user.location.lat, user.location.lng]);
    }
    if (user?.address) {
      setAddress(user.address);
    }
  }, [user]);

  const handleAddressSelect = (lat: number, lng: number, selectedAddress: string) => {
    // Only populate address field if it is currently empty
    if (!address.trim()) {
      setAddress(selectedAddress);
    }
    setCoordinates([lat, lng]);
  };

  const handleGeolocation = (lat: number, lng: number, addr?: string) => {
    setCoordinates([lat, lng]);
    if (addr && !address.trim()) {
      setAddress(addr);
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
        {/* Current Address (editable) */}
        <div className="space-y-2">
          <Label htmlFor="current-address">Current Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="current-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address"
              className="pl-10"
            />
          </div>
        </div>

        {/* Address Search */}
        <div className="space-y-2">
          <Label htmlFor="address-search">Search Address</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <AddressAutocomplete
                value={searchInput}
                onChange={setSearchInput}
                onSelect={handleAddressSelect}
                placeholder="Search for an address..."
              />
            </div>
            <GeolocationButton onLocationFound={handleGeolocation} />
          </div>
          <p className="text-sm text-muted-foreground">
            Search for suggestions or use your current location. Selecting a suggestion will only fill the address above if it is empty.
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
