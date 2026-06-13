"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Provider } from "@/lib/types";
import { useEffect } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
const AnyMapContainer = MapContainer as any;
const AnyTileLayer    = TileLayer as any;
const AnyCircleMarker = CircleMarker as any;
const AnyTooltip      = Tooltip as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface ProviderWithCost extends Provider {
  yourCost: number;
  stickerPrice: number;
}

interface MapViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers: any[];
  center: { lat: number; lng: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPinClick: (provider: any) => void;
  selectedId?: string | null;
  flyTarget?: { lat: number; lng: number } | null;
}

function colorFor(yourCost: number): string {
  if (yourCost < 0)   return "#9ca3af";
  if (yourCost < 200) return "#1f9d55";
  if (yourCost < 500) return "#d97706";
  return "#dc2626";
}

function FlyToCenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng]);
  return null;
}

function FlyToTarget({ target }: { target: { lat: number; lng: number } | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 14, { duration: 1.2 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return null;
}

export default function MapView({ providers, center, onPinClick, selectedId, flyTarget }: MapViewProps) {
  return (
    <AnyMapContainer
      center={[center.lat, center.lng]}
      zoom={9}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <AnyTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <FlyToCenter center={center} />
      <FlyToTarget target={flyTarget} />

      {/* User location */}
      <AnyCircleMarker
        center={[center.lat, center.lng]}
        radius={8}
        pathOptions={{ color: "#0a6e6e", fillColor: "#0a6e6e", fillOpacity: 0.9 }}
      >
        <AnyTooltip permanent={false}>You are here</AnyTooltip>
      </AnyCircleMarker>

      {providers.map((p) => {
        const noTest     = p.yourCost < 0;
        const inNetwork  = p.inNetwork !== false;
        const color      = colorFor(p.yourCost);
        const isSelected = p.id === selectedId;
        const ringColor  = noTest ? "#d1d5db" : isSelected ? "#16a34a" : inNetwork ? "#fff" : "#f97316";
        return (
          <AnyCircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={isSelected ? 18 : noTest ? 10 : 14}
            pathOptions={{
              color:       ringColor,
              weight:      isSelected ? 4 : noTest ? 1.5 : 2.5,
              fillColor:   color,
              fillOpacity: noTest ? 0.55 : 0.95,
            }}
            eventHandlers={{ click: () => !noTest && onPinClick(p) }}
          >
            <AnyTooltip direction="top" offset={[0, -12]}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
              {noTest ? (
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Search for a test to see your cost
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: inNetwork ? "#15803d" : "#be123c", fontWeight: 600 }}>
                    {inNetwork ? "✓ In-network" : "✗ Out-of-network"}
                  </div>
                  <div style={{ fontSize: 12, color: "#555" }}>
                    Your cost: <strong style={{ color }}>${p.yourCost.toLocaleString()}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: "#888" }}>Click for full breakdown</div>
                </>
              )}
            </AnyTooltip>
          </AnyCircleMarker>
        );
      })}
    </AnyMapContainer>
  );
}
