"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ProductMapProps {
  latitude: number;
  longitude: number;
  productName: string;
}

// Fix for default marker icon in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export function ProductMap({
  latitude,
  longitude,
  productName,
}: ProductMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current).setView([latitude, longitude], 13);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add marker for product location
    const marker = L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(`<b>${productName}</b>`)
      .openPopup();

    mapRef.current = map;

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, productName]);

  // Update marker position if coordinates change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], 13);
      // Remove old markers
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapRef.current?.removeLayer(layer);
        }
      });
      // Add new marker
      L.marker([latitude, longitude])
        .addTo(mapRef.current)
        .bindPopup(`<b>${productName}</b>`)
        .openPopup();
    }
  }, [latitude, longitude, productName]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[200px] sm:h-[300px] rounded-[var(--radius-card)] overflow-hidden border border-[var(--fresh-border)]"
      aria-label={`Map showing location of ${productName}`}
      role="img"
    />
  );
}
