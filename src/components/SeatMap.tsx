"use client";

import { useRef, useState } from "react";
import type { TVenue } from "@/types/venue";
import { useSelection } from "@/store/selection";
import { useUI } from "@/store/ui";
import { usePanZoom } from "@/hooks/usePanZoom";
import { useSeatIndex } from "@/hooks/useSeatIndex";
import { useSeatTooltip } from "@/hooks/useSeatTooltip";
import { PRICE_BY_TIER, formatUSD } from "@/lib/pricing";
import clsx from "clsx";

type Props = { venue: TVenue };

export default function SeatMap({ venue }: Props) {
  const { selected, toggle } = useSelection();
  const heatmap = useUI((s) => s.heatmap);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const { svgRef, transform, handlers } = usePanZoom();
  const { byId, grid, total } = useSeatIndex(venue);
  const { tip, onMouseMove, onMouseLeave } = useSeatTooltip(svgRef);

  const SEAT = { w: 26, h: 26, rx: 6 };
  const CELL = 36;
  const showNumbers = total <= 500;

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const el = (e.target as Element).closest("[data-seat-id]") as SVGGElement | null;
    if (!el) return;
    const id = el.dataset.seatId!;
    toggle(id);
    setFocusedId(id);
    el.focus();
  };

  const onFocusCapture = (e: React.FocusEvent<SVGSVGElement>) => {
    const el = e.target as SVGGElement;
    const id = el?.getAttribute("data-seat-id");
    if (id) setFocusedId(id);
  };

  const onKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    const el = e.target as SVGGElement;
    const id = el.getAttribute("data-seat-id");
    if (!id) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(id);
      return;
    }

    const cur = byId.get(id);
    if (!cur) return;

    let next: string | null = null;
    if (e.key === "ArrowRight") next = grid.get(`${cur.sectionId}:${cur.row}:${cur.col + 1}`) ?? null;
    if (e.key === "ArrowLeft")  next = grid.get(`${cur.sectionId}:${cur.row}:${cur.col - 1}`) ?? null;
    if (e.key === "ArrowUp")    next = grid.get(`${cur.sectionId}:${cur.row - 1}:${cur.col}`) ?? null;
    if (e.key === "ArrowDown")  next = grid.get(`${cur.sectionId}:${cur.row + 1}:${cur.col}`) ?? null;
    if (!next) return;

    setFocusedId(next);
    svgRef.current?.querySelector<SVGGElement>(`[data-seat-id="${CSS.escape(next)}"]`)?.focus();
    e.preventDefault();
  };

  return (
    <div className="relative w-full overflow-hidden md:overflow-visible">
      <svg
        ref={svgRef}
        width={venue.map.width}
        height={venue.map.height}
        role="listbox"
        aria-label={`${venue.name} seating`}
        className="max-w-full h-auto border border-gray-200 dark:border-gray-800 rounded bg-black/80 touch-none"
        onClick={onClick}
        onKeyDown={onKeyDown}
        onFocusCapture={onFocusCapture}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        {...handlers}
        tabIndex={-1}
      >
        <g transform={transform}>
          {venue.sections.map((sec) => {
            const s = sec.transform?.scale ?? 1;
            const sx = sec.transform?.x ?? 0;
            const sy = sec.transform?.y ?? 0;

            return (
              <g key={sec.id} transform={`translate(${sx},${sy})`}>
                {sec.rows.map((r) =>
                  r.seats.map((seat) => {
                    const x = (seat.x ?? (seat.col - 1) * CELL) * s;
                    const y = (seat.y ?? (r.index - 1) * CELL) * s;

                    const isSelected = selected.includes(seat.id);
                    const status = (seat.status ?? "available") as
                      | "available" | "reserved" | "sold" | "held";

                    const tierFill =
                      seat.priceTier >= 4 ? "fill-tier-4"
                      : seat.priceTier === 3 ? "fill-tier-3"
                      : seat.priceTier === 2 ? "fill-tier-2"
                      : "fill-tier-1";

                    const statusFill =
                      status === "available" ? "fill-seat-available"
                      : status === "reserved" ? "fill-seat-reserved"
                      : status === "sold" ? "fill-seat-sold"
                      : "fill-seat-held";

                    const fillClass = isSelected ? "fill-seat-selected" : (heatmap ? tierFill : statusFill);

                    return (
                      <g
                        key={seat.id}
                        data-seat-id={seat.id}
                        role="option"
                        aria-label={`Section ${sec.id}, Row ${r.index}, Seat ${seat.col}, ${status}`}
                        aria-selected={isSelected}
                        tabIndex={0}
                        className="svg-focus"
                        transform={`translate(${x},${y})`}
                      >
                        <rect
                          width={SEAT.w}
                          height={SEAT.h}
                          rx={SEAT.rx}
                          className={clsx(
                            fillClass,
                            !heatmap && status !== "available" && !isSelected && "opacity-60"
                          )}
                          x={-SEAT.w / 2}
                          y={-SEAT.h / 2}
                        />
                        {showNumbers && (
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="text-[10px] fill-white/90 select-none pointer-events-none"
                          >
                            {seat.col}
                          </text>
                        )}
                      </g>
                    );
                  })
                )}

                {sec.rows.map((r) => {
                  const ss = s;
                  const SEAT_W = SEAT.w;

                  const ys = r.seats.map((s) => s.y).filter((v): v is number => typeof v === "number");
                  const baseY = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : (r.index - 1) * CELL;
                  const rowY = baseY * ss;

                  const xs = r.seats.map((s) => s.x).filter((v): v is number => typeof v === "number");
                  const firstX = xs.length ? Math.min(...xs) : 0;
                  const rowX = firstX * ss - (SEAT_W / 2 + 12);

                  return (
                    <text
                      key={`row-${sec.id}-${r.index}`}
                      x={rowX}
                      y={rowY}
                      textAnchor="end"
                      dominantBaseline="central"
                      className="fill-white/70 text-xs select-none pointer-events-none"
                    >
                      {String.fromCharCode(64 + r.index)}
                    </text>
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>

      {tip && (() => {
        const seat = byId.get(tip.id);
        if (!seat) return null;
        const status = (seat.status ?? "available") as "available" | "reserved" | "sold" | "held";
        const price = PRICE_BY_TIER[seat.priceTier] ?? 0;
        return (
          <div
            role="tooltip"
            className="absolute z-10 pointer-events-none rounded-lg border border-white/15 bg-black/80 text-white/90 px-2 py-1 text-xs shadow-lg backdrop-blur"
            style={{ left: tip.x, top: tip.y }}
          >
            <div className="font-medium">{tip.id}</div>
            <div className="opacity-80">Price: {formatUSD(price)}</div>
            <div className="opacity-80 capitalize">Status: {status}</div>
          </div>
        );
      })()}
    </div>
  );
}
