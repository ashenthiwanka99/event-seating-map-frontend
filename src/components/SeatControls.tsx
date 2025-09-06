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

  const remaining = Math.max(0, 8 - selected.length);

  function onFind() {
    const wanted = Math.min(8, Math.max(1, n));
    const ids = findAdjacentSeats(Math.min(remaining, wanted));
    if (ids.length) addMany(ids);
  }

  return (
    <div className="toolbar mb-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="switch"
          data-checked={heatmap ? "true" : "false"}
          onClick={() => setHeatmap(!heatmap)}
          aria-pressed={heatmap}
          aria-label="Toggle heat map by price tier"
        >
          <span className="switch-dot" />
        </button>
        <span className="text-sm">Heat-map by price tier</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="badge">Remaining {remaining}/8</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn rounded-md px-2 py-1"
            onClick={() => setN((v) => Math.max(1, v - 1))}
            aria-label="Decrease seats"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={8}
            value={n}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setN(Number.isFinite(v) ? Math.min(8, Math.max(1, v)) : 1);
            }}
            inputMode="numeric"
            className="input w-16 text-center"
            aria-label="Number of adjacent seats (max 8)"
          />
          <button
            type="button"
            className="btn rounded-md px-2 py-1"
            onClick={() => setN((v) => Math.min(8, v + 1))}
            aria-label="Increase seats"
          >
            +
          </button>
        </div>

        <button onClick={onFind} className="btn-primary">
          Find adjacent
        </button>
      </div>
    </div>
  );
}
