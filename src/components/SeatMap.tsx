"use client";

import { useMemo, useRef, useState } from "react";
import type { TVenue, TSeat } from "@/types/venue";
import { useSelection } from "@/store/selection";
import { useUI } from "@/store/ui";
import clsx from "clsx";

type Props = { venue: TVenue };

type Ptr = { id: number; x: number; y: number };

export default function SeatMap({ venue }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { selected, toggle } = useSelection();
  const heatmap = useUI((s) => s.heatmap);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const MIN = 0.6;
  const MAX = 5;

  const ptrs = useRef<Map<number, Ptr>>(new Map());
  const pinchStart = useRef<{
    dist: number;
    center: { x: number; y: number };
    content: { x: number; y: number };
    scale: number;
  } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const getBBox = () => svgRef.current!.getBoundingClientRect();

  const toContent = (clientX: number, clientY: number) => {
    const { left, top } = getBBox();
    const x = (clientX - left - tx) / scale;
    const y = (clientY - top - ty) / scale;
    return { x, y };
  };

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
    const nextEl = svgRef.current?.querySelector<SVGGElement>(
      `[data-seat-id="${CSS.escape(nextId)}"]`
    );
    nextEl?.focus();
    e.preventDefault();
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });

    if (ptrs.current.size === 1) {
      panStart.current = { x: e.clientX, y: e.clientY, tx, ty };
    } else if (ptrs.current.size === 2) {
      const [p1, p2] = [...ptrs.current.values()];
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const { left, top } = getBBox();
      const centerContent = toContent(cx, cy);
      pinchStart.current = {
        dist,
        center: { x: cx - left, y: cy - top },
        content: centerContent,
        scale,
      };
      panStart.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });

    if (ptrs.current.size === 1 && panStart.current) {
      const p0 = panStart.current;
      const dx = e.clientX - p0.x;
      const dy = e.clientY - p0.y;
      setTx(p0.tx + dx);
      setTy(p0.ty + dy);
    } else if (ptrs.current.size >= 2 && pinchStart.current) {
      const [a, b] = [...ptrs.current.values()];
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const newDist = Math.hypot(b.x - a.x, b.y - a.y);

      const s0 = pinchStart.current.scale;
      const s = clamp(s0 * (newDist / pinchStart.current.dist), MIN, MAX);
      setScale(s);

      const { left, top } = getBBox();
      const mx = cx - left;
      const my = cy - top;
      const txNew = mx - pinchStart.current.content.x * s;
      const tyNew = my - pinchStart.current.content.y * s;
      setTx(txNew);
      setTy(tyNew);
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) {
      panStart.current = null;
      pinchStart.current = null;
    } else if (ptrs.current.size === 1) {
      const only = [...ptrs.current.values()][0];
      panStart.current = { x: only.x, y: only.y, tx, ty };
      pinchStart.current = null;
    }
  };

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const { left, top } = getBBox();
    const cursor = { x: e.clientX - left, y: e.clientY - top };
    const contentPt = toContent(e.clientX, e.clientY);

    const delta = Math.sign(e.deltaY) * 0.2;
    const s = clamp(scale * (1 - delta), MIN, MAX);
    setScale(s);
    setTx(cursor.x - contentPt.x * s);
    setTy(cursor.y - contentPt.y * s);
  };

  const SEAT = { w: 26, h: 26, rx: 6 };
  const CELL = 36;

  const totalSeats = useMemo(
    () =>
      venue.sections.reduce(
        (a, s) => a + s.rows.reduce((b, r) => b + r.seats.length, 0),
        0
      ),
    [venue]
  );
  const showNumbers = totalSeats <= 500;

  return (
    <div className="w-full overflow-hidden md:overflow-visible">
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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        tabIndex={-1}
      >
        <g transform={`translate(${tx},${ty}) scale(${scale})`}>
          {venue.sections.map((sec) => {
            const s = sec.transform?.scale ?? 1;
            return (
              <g key={sec.id} transform={`translate(${sec.transform?.x ?? 0},${sec.transform?.y ?? 0})`}>
                {sec.rows.map((r) =>
                  r.seats.map((seat) => {
                    const xCoord = (seat.x ?? (seat.col - 1) * CELL) * s;
                    const yCoord = (seat.y ?? (r.index - 1) * CELL) * s;

                    const isSelected = selected.includes(seat.id);
                    const status = (seat.status ?? "available") as
                      | "available"
                      | "reserved"
                      | "sold"
                      | "held";

                    const tierFill =
                      seat.priceTier >= 4
                        ? "fill-tier-4"
                        : seat.priceTier === 3
                          ? "fill-tier-3"
                          : seat.priceTier === 2
                            ? "fill-tier-2"
                            : "fill-tier-1";

                    const statusFill =
                      status === "available"
                        ? "fill-seat-available"
                        : status === "reserved"
                          ? "fill-seat-reserved"
                          : status === "sold"
                            ? "fill-seat-sold"
                            : "fill-seat-held";

                    const fillClass = isSelected
                      ? "fill-seat-selected"
                      : heatmap
                        ? tierFill
                        : statusFill;

                    return (
                      <g
                        key={seat.id}
                        data-seat-id={seat.id}
                        role="option"
                        aria-label={`Section ${sec.id}, Row ${r.index}, Seat ${seat.col}, ${status}`}
                        aria-selected={isSelected}
                        tabIndex={0}
                        className="svg-focus"
                        transform={`translate(${xCoord},${yCoord})`}
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
                  const ss = sec.transform?.scale ?? 1;

                  const ys = r.seats.map((s) => s.y).filter((v): v is number => typeof v === "number");
                  const baseY = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : (r.index - 1) * CELL;
                  const rowY = baseY * ss;

                  const xs = r.seats.map((s) => s.x).filter((v): v is number => typeof v === "number");
                  const firstX = xs.length ? Math.min(...xs) : 0;
                  const rowX = firstX * ss - (SEAT.w / 2 + 12);

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
    </div>
  );
}
