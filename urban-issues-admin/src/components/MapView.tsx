"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
      Loading map…
    </div>
  ),
});

export default function MapView() {
  return <Map />;
}
