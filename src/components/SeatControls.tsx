"use client";
import { useMemo, useState } from "react";
import type { TVenue } from "@/types/venue";
import { useUI } from "@/store/ui";
import { useSelection } from "@/store/selection";

type Props = { venue: TVenue };

export default function SeatControls({ venue }: Props) {
  const heatmap = useUI((s) => s.heatmap);
  const setHeatmap = useUI((s) => s.setHeatmap);
  const { selected, addMany } = useSelection();
  const [n, setN] = useState(2);

  const rows = useMemo(() => {
    return venue.sections.flatMap((sec) =>
      sec.rows.map((r) => ({
        key: `${sec.id}:${r.index}`,
        secId: sec.id,
        index: r.index,
        seats: [...r.seats].sort((a, b) => a.col - b.col),
      }))
    );
  }, [venue]);

  function findAdjacentSeats(count: number): string[] {
    let best: { ids: string[]; rowIdx: number; dist: number } | null = null;
    for (const r of rows) {
      const cols = r.seats.map((s) => s.col);
      const maxCol = cols.length ? Math.max(...cols) : 0;
      const centerCol = (maxCol + 1) / 2;

      for (let i = 0; i <= r.seats.length - count; i++) {
        const window = r.seats.slice(i, i + count);
        let ok = true;
        for (let k = 1; k < window.length; k++) {
          if (window[k].col !== window[0].col + k) { ok = false; break; }
        }
        if (!ok) continue;
        if (window.some((s) => selected.includes(s.id))) continue;
        if (window.some((s) => (s.status ?? "available") !== "available")) continue;

        const mid = window[0].col + (count - 1) / 2;
        const dist = Math.abs(mid - centerCol);
        const ids = window.map((s) => s.id);

        if (!best || dist < best.dist || (dist === best.dist && r.index < rows[best.rowIdx].index)) {
          best = { ids, rowIdx: rows.indexOf(r), dist };
        }
      }
    }
    return best?.ids ?? [];
  }

  function onFind() {
    const ids = findAdjacentSeats(Math.max(1, Math.min(8, n)));
    if (ids.length) addMany(ids);
  }

  return (
    <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={heatmap}
          onChange={(e) => setHeatmap(e.target.checked)}
          className="size-4 accent-blue-600"
          aria-label="Toggle heat map"
        />
        <span>Heat-map by price tier</span>
      </label>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={8}
          value={n}
          onChange={(e) => setN(parseInt(e.target.value || "1", 10))}
          className="w-16 rounded-md border border-gray-300 bg-transparent px-2 py-1 text-sm"
          aria-label="Number of adjacent seats"
        />
        <button onClick={onFind} className="btn-primary">
          Find Available Seats
        </button>
      </div>
    </div>
  );
}
