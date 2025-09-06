"use client";

import { useMemo, useRef, useState } from "react";
import type { TVenue, TSeat } from "@/types/venue";
import { useSelection } from "@/store/selection";
import clsx from "clsx";

type Props = { venue: TVenue };

export default function SeatMap({ venue }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { selected, toggle } = useSelection();
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const seatIndex = useMemo(() => {
    const byId = new Map<string, TSeat & { sectionId: string; row: number }>();
    const grid = new Map<string, string>();
    for (const sec of venue.sections) {
      for (const r of sec.rows) {
        for (const s of r.seats) {
          byId.set(s.id, { ...s, sectionId: sec.id, row: r.index });
          grid.set(`${sec.id}:${r.index}:${s.col}`, s.id);
        }
      }
    }
    return { byId, grid };
  }, [venue]);

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const el = (e.target as Element).closest("[data-seat-id]") as SVGGElement | null;
    if (!el) return;
    toggle(el.dataset.seatId!);
    setFocusedId(el.dataset.seatId!);
    el.focus();
  };

  const onFocusCapture = (e: React.FocusEvent<SVGSVGElement>) => {
    const el = e.target as SVGGElement;
    if (el?.getAttribute("data-seat-id")) setFocusedId(el.getAttribute("data-seat-id"));
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
    const cur = seatIndex.byId.get(id);
    if (!cur) return;

    let nextKey: string | null = null;
    if (e.key === "ArrowRight") nextKey = `${cur.sectionId}:${cur.row}:${cur.col + 1}`;
    if (e.key === "ArrowLeft") nextKey = `${cur.sectionId}:${cur.row}:${cur.col - 1}`;
    if (e.key === "ArrowUp") nextKey = `${cur.sectionId}:${cur.row - 1}:${cur.col}`;
    if (e.key === "ArrowDown") nextKey = `${cur.sectionId}:${cur.row + 1}:${cur.col}`;
    if (!nextKey) return;

    const nextId = seatIndex.grid.get(nextKey);
    if (!nextId) return;
    setFocusedId(nextId);
    const nextEl = svgRef.current?.querySelector<SVGGElement>(`[data-seat-id="${CSS.escape(nextId)}"]`);
    nextEl?.focus();
    e.preventDefault();
  };

  const SEAT = { w: 26, h: 26, rx: 6 };
  const CELL = 36;

  const totalSeats = venue.sections.reduce((a, s) => a + s.rows.reduce((b, r) => b + r.seats.length, 0), 0);
  const showNumbers = totalSeats <= 500;

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        width={venue.map.width}
        height={venue.map.height}
        role="listbox"
        aria-label={`${venue.name} seating`}
        className="max-w-full h-auto border border-gray-200 dark:border-gray-800 rounded bg-black/80"
        onClick={onClick}
        onKeyDown={onKeyDown}
        onFocusCapture={onFocusCapture}
        tabIndex={-1}
      >
        {venue.sections.map((sec) => {
          const s = sec.transform.scale ?? 1;
          return (
            <g key={sec.id} transform={`translate(${sec.transform.x},${sec.transform.y})`}>
              {sec.rows.map((r) =>
                r.seats.map((seat) => {
                  const xCoord = (seat.x ?? (seat.col - 1) * CELL) * s;
                  const yCoord = (seat.y ?? (r.index - 1) * CELL) * s;

                  const isSelected = selected.includes(seat.id);
                  const fill =
                    seat.status === "available"
                      ? "fill-seat-available"
                      : seat.status === "reserved"
                        ? "fill-seat-reserved"
                        : seat.status === "sold"
                          ? "fill-seat-sold"
                          : "fill-seat-held";

                  return (
                    <g
                      key={seat.id}
                      data-seat-id={seat.id}
                      role="option"
                      aria-label={`Section ${sec.id}, Row ${r.index}, Seat ${seat.col}, ${seat.status}`}
                      aria-selected={isSelected}
                      tabIndex={0}
                      className="svg-focus"
                      transform={`translate(${xCoord},${yCoord})`}
                    >
                      <rect
                        width={SEAT.w}
                        height={SEAT.h}
                        rx={SEAT.rx}
                        className={clsx(isSelected ? "fill-seat-selected" : fill, seat.status !== "available" && !isSelected && "opacity-60")}
                        x={-SEAT.w / 2}
                        y={-SEAT.h / 2}
                      />
                      {showNumbers && (
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="text-[10px] fill-white/90"
                        >
                          {seat.col}
                        </text>
                      )}
                    </g>
                  );
                })
              )}
              {sec.rows.map((r) => (
                <text key={`row-${r.index}`} x={-24} y={(r.index - 1) * CELL * s} className="fill-white/70 text-xs" dominantBaseline="central">
                  {String.fromCharCode(64 + r.index)}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
