"use client";
import { useMemo, useRef, useState } from "react";

import { useSelection } from "@/store/selection";
import clsx from "clsx";
import { TSeat, TVenue } from "@/types/venue";

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
    const el = (e.target as Element) as SVGGElement;
    if (el?.getAttribute("data-seat-id")) setFocusedId(el.getAttribute("data-seat-id"));
  };

  const onKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    const el = (e.target as Element) as SVGGElement;
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
    if (e.key === "ArrowLeft")  nextKey = `${cur.sectionId}:${cur.row}:${cur.col - 1}`;
    if (e.key === "ArrowUp")    nextKey = `${cur.sectionId}:${cur.row - 1}:${cur.col}`;
    if (e.key === "ArrowDown")  nextKey = `${cur.sectionId}:${cur.row + 1}:${cur.col}`;
    if (!nextKey) return;

    const nextId = seatIndex.grid.get(nextKey);
    if (!nextId) return;

    setFocusedId(nextId);
    const nextEl = svgRef.current?.querySelector<SVGGElement>(`[data-seat-id="${CSS.escape(nextId)}"]`);
    nextEl?.focus();
    e.preventDefault();
  };

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        width={venue.map.width}
        height={venue.map.height}
        role="listbox"
        aria-label={`${venue.name} seating`}
        className="max-w-full h-auto border border-gray-200 dark:border-gray-800 rounded"
        onClick={onClick}
        onKeyDown={onKeyDown}
        onFocusCapture={onFocusCapture}
        tabIndex={-1}
      >
        <defs>
          <symbol id="seat-dot" viewBox="-6 -6 12 12">
            <circle r="5.2" />
          </symbol>
        </defs>

        {venue.sections.map((sec) => (
          <g
            key={sec.id}
            transform={`translate(${sec.transform.x},${sec.transform.y}) scale(${sec.transform.scale})`}
          >
            {sec.rows.map((r) =>
              r.seats.map((s) => {
                const isSelected = selected.includes(s.id);
                const isFocused = focusedId === s.id;
                const fill =
                  s.status === "available"
                    ? "seat-available"
                    : s.status === "reserved"
                    ? "seat-reserved"
                    : s.status === "sold"
                    ? "seat-sold"
                    : "seat-held";

                return (
                  <g
                    key={s.id}
                    data-seat-id={s.id}
                    data-sec={sec.id}
                    data-row={r.index}
                    data-col={s.col}
                    role="option"
                    aria-label={`Section ${sec.id}, Row ${r.index}, Seat ${s.col}, ${s.status}`}
                    aria-selected={isSelected}
                    tabIndex={0}
                    className={clsx("svg-focus")}
                    transform={`translate(${s.x},${s.y})`}
                  >
                    <use
                      href="#seat-dot"
                      className={clsx(
                        isSelected ? "fill-seat-selected" : `fill-${fill}`,
                        s.status !== "available" && !isSelected ? "opacity-60" : "opacity-100"
                      )}
                    />
                    {isFocused && (
                      <circle r="7.5" className="stroke-cyan-500" strokeWidth={2} fill="none" />
                    )}
                  </g>
                );
              })
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
