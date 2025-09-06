import { useMemo } from "react";
import type { TVenue, TSeat } from "@/types/venue";

export type SeatIndex = {
  byId: Map<string, TSeat & { sectionId: string; row: number }>;
  grid: Map<string, string>;
  total: number;
};

export function useSeatIndex(venue: TVenue): SeatIndex {
  return useMemo(() => {
    const byId = new Map<string, TSeat & { sectionId: string; row: number }>();
    const grid = new Map<string, string>();
    let total = 0;
    for (const sec of venue.sections) {
      for (const r of sec.rows) {
        for (const s of r.seats) {
          byId.set(s.id, { ...s, sectionId: sec.id, row: r.index });
          grid.set(`${sec.id}:${r.index}:${s.col}`, s.id);
          total++;
        }
      }
    }
    return { byId, grid, total };
  }, [venue]);
}
