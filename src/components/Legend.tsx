"use client";

import { useUI } from "@/store/ui";

export default function Legend() {
  const heatmap = useUI((s) => s.heatmap);
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {!heatmap ? (
        <>
          <Badge label="Available" className="bg-seat-available/70" />
          <Badge label="Reserved" className="bg-seat-reserved/70" />
          <Badge label="Sold" className="bg-seat-sold/70" />
          <Badge label="Held" className="bg-seat-held/70" />
          <Badge label="Selected" className="bg-seat-selected/80" />
        </>
      ) : (
        <>
          <Badge label="Tier 1" className="bg-tier-1/80" />
          <Badge label="Tier 2" className="bg-tier-2/80" />
          <Badge label="Tier 3" className="bg-tier-3/80" />
          <Badge label="Tier 4" className="bg-tier-4/80" />
        </>
      )}
    </div>
  );
}

function Badge({ label, className }: { label: string; className?: string }) {
  return <span className={`badge ${className}`}>{label}</span>;
}
