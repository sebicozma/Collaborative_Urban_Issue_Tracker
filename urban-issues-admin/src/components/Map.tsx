"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl.src,
  iconUrl: iconUrl.src,
  shadowUrl: shadowUrl.src,
});

const MAP_CENTER: [number, number] = [45.7597, 21.23];

const SAMPLE_REPORT: [number, number] = [45.7597, 21.23];

export default function Map() {
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
      <Marker position={SAMPLE_REPORT}>
        <Popup>
          Sample report
          <br />
          45.7597, 21.2300
        </Popup>
      </Marker>
    </MapContainer>
  );
}
