"use client";

import dynamic from "next/dynamic";
import type { ReportSummary } from "@/lib/reports";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
      Loading map…
    </div>
  ),
});

export default function MapView({ reports }: { reports: ReportSummary[] }) {
  return <Map reports={reports} />;
}
