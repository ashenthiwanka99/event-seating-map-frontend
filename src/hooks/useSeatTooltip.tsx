"use client";
import { useState } from "react";

export type TipState = { x: number; y: number; id: string } | null;

export function useSeatTooltip(_svgRef?: React.RefObject<SVGSVGElement | null>) {
  const [tip, setTip] = useState<TipState>(null);

  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const g = (e.target as Element).closest("[data-seat-id]") as SVGGElement | null;
    if (!g) return setTip(null);
    const id = g.dataset.seatId!;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    setTip({ id, x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12 });
  }

  function onMouseLeave() {
    setTip(null);
  }

  return { tip, onMouseMove, onMouseLeave };
}
