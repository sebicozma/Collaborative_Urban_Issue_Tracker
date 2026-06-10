"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ReportSummary } from "@/lib/reports";

const MAP_CENTER: [number, number] = [45.7597, 21.23];

// Marker color by status (mirrors the StatusBadge palette). Falls back to emerald.
const STATUS_COLOR: Record<string, string> = {
  submitted: "#2563EB",
  in_review: "#D97706",
  classified: "#7C3AED",
  approved: "#059669",
  rejected: "#DC2626",
};

/**
 * Self-contained SVG pin as a Leaflet divIcon. Avoids Leaflet's default PNG marker,
 * whose bundled image paths don't resolve reliably under Next/Turbopack (the marker
 * then renders as broken-image alt text). `className: ""` drops the default white box.
 */
function pinIcon(status: string): L.DivIcon {
  const color = STATUS_COLOR[status] ?? "#059669";
  return L.divIcon({
    className: "",
    iconSize: [26, 36],
    iconAnchor: [13, 36],
    popupAnchor: [0, -34],
    html: `<svg width="26" height="36" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.82 0 0 5.82 0 13c0 9.4 10.5 21.3 12.2 23.2a1.1 1.1 0 0 0 1.6 0C15.5 34.3 26 22.4 26 13 26 5.82 20.18 0 13 0z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="13" cy="13" r="4.5" fill="#ffffff"/>
    </svg>`,
  });
}

export default function Map({ reports }: { reports: ReportSummary[] }) {
  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={14}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.map((report) => (
        <Marker
          key={report.reportId}
          position={[report.location.lat, report.location.lon]}
          icon={pinIcon(report.status)}
        >
          <Popup>
            <strong>{report.title}</strong>
            <br />
            {report.category ?? "uncategorised"} · {report.status}
            <br />
            {new Date(report.createdAt).toLocaleString()}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
