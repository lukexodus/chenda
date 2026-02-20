"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Product } from "@/lib/stores/searchStore";
import GeolocationButton from "./GeolocationButton";

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface SearchResultsMapProps {
  products: Product[];
  buyerLocation?: { lat: number; lng: number };
  searchRadius?: number; // in km
  onMarkerClick: (product: Product) => void;
  onLocationUpdate?: (lat: number, lng: number) => void;
  className?: string;
}

export default function SearchResultsMap({
  products,
  buyerLocation,
  searchRadius = 50,
  onMarkerClick,
  onLocationUpdate,
  className = "",
}: SearchResultsMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);
  const buyerMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center on buyer location or Manila default
    const center: [number, number] = buyerLocation
      ? [buyerLocation.lat, buyerLocation.lng]
      : [14.5995, 120.9842];

    const map = L.map(mapContainerRef.current).setView(center, 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update buyer marker and radius circle
  useEffect(() => {
    if (!mapRef.current || !buyerLocation) return;

    // Remove old buyer marker
    if (buyerMarkerRef.current) {
      buyerMarkerRef.current.remove();
    }

    // Remove old circle
    if (circleRef.current) {
      circleRef.current.remove();
    }

    // Create buyer marker (blue)
    const buyerIcon = L.divIcon({
      className: "custom-marker",
      html: `
        <div class="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full border-4 border-white shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    const buyerMarker = L.marker([buyerLocation.lat, buyerLocation.lng], {
      icon: buyerIcon,
    })
      .addTo(mapRef.current)
      .bindPopup(
        `<div class="text-center font-semibold">📍 You are here</div>`
      );

    buyerMarkerRef.current = buyerMarker;

    // Add radius circle
    const circle = L.circle([buyerLocation.lat, buyerLocation.lng], {
      radius: searchRadius * 1000, // Convert km to meters
      color: "#3b82f6",
      fillColor: "#3b82f6",
      fillOpacity: 0.1,
      weight: 2,
      dashArray: "5, 5",
    }).addTo(mapRef.current);

    circleRef.current = circle;

    // Fit bounds to include circle
    mapRef.current.fitBounds(circle.getBounds(), {
      padding: [50, 50],
    });
  }, [buyerLocation, searchRadius]);

  // Update product markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    products.forEach((product) => {
      // Skip if no location data
      if (!product.latitude || !product.longitude) return;

      const freshness = product.freshness_score || 0;
      
      // Color code by freshness
      let markerColor = "#ef4444"; // red (expiring)
      let freshnessLabel = "Expiring Soon";
      
      if (freshness >= 80) {
        markerColor = "#22c55e"; // green (fresh)
        freshnessLabel = "Fresh";
      } else if (freshness >= 50) {
        markerColor = "#eab308"; // yellow (medium)
        freshnessLabel = "Good";
      } else if (freshness >= 30) {
        markerColor = "#f97316"; // orange (low)
        freshnessLabel = "Fair";
      }

      const productIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full border-3 border-white shadow-lg" style="background-color: ${markerColor}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([product.latitude, product.longitude], {
        icon: productIcon,
      })
        .addTo(mapRef.current!)
        .bindPopup(
          `
          <div class="min-w-[200px]">
            <h3 class="font-bold text-base mb-1">${product.name}</h3>
            <p class="text-sm text-gray-600 mb-2">${product.product_type_name || 'N/A'}</p>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">Price:</span>
                <span class="font-semibold">₱${product.price}/${product.unit}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Distance:</span>
                <span>${product.distance_km?.toFixed(1) || 0} km</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Freshness:</span>
                <span class="font-semibold" style="color: ${markerColor}">${freshness.toFixed(0)}% (${freshnessLabel})</span>
              </div>
            </div>
            <button 
              class="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
              onclick="window.dispatchEvent(new CustomEvent('map-marker-click', { detail: { productId: '${product.id}' } }))"
            >
              View Details
            </button>
          </div>
        `,
          {
            maxWidth: 250,
          }
        );

      markersRef.current.push(marker);
    });
  }, [products]);

  // Handle marker clicks via custom event
  useEffect(() => {
    const handleMarkerClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      const productId = customEvent.detail.productId;
      const product = products.find((p) => p.id === productId);
      if (product) {
        onMarkerClick(product);
      }
    };

    window.addEventListener("map-marker-click", handleMarkerClick);
    return () => window.removeEventListener("map-marker-click", handleMarkerClick);
  }, [products, onMarkerClick]);

  const handleGeolocation = (lat: number, lng: number) => {
    if (onLocationUpdate) {
      onLocationUpdate(lat, lng);
    }

    // Pan to new location
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 13);
    }
  };

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full rounded-lg" />
      
      {/* Geolocation button overlay */}
      <div className="absolute top-4 right-4 z-[1000]">
        <GeolocationButton
          onLocationFound={handleGeolocation}
          size="icon"
          showLabel={false}
          className="bg-white hover:bg-gray-100 shadow-lg"
        />
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white p-3 rounded-lg shadow-lg">
        <h4 className="text-xs font-semibold mb-2">Freshness</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Fresh (80-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span>Good (50-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span>Fair (30-49%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Expiring (&lt;30%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
