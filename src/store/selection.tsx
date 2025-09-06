import { create } from "zustand";
import { persist } from "zustand/middleware";

type SelState = {
  selected: string[];
  toggle: (id: string) => void;
  addMany: (ids: string[]) => void;
  clear: () => void;
};

export const useSelection = create<SelState>()(
  persist(
    (set, get) => ({
      selected: [],
      toggle: (id) => {
        const cur = get().selected;
        const exists = cur.includes(id);
        if (exists) set({ selected: cur.filter((s) => s !== id) });
        else if (cur.length < 8) set({ selected: [...cur, id] });
      },
      addMany: (ids) => {
        const cur = get().selected;
        const remaining = 8 - cur.length;
        if (remaining <= 0) return;
        const toAdd = ids.filter((id) => !cur.includes(id)).slice(0, remaining);
        if (toAdd.length) set({ selected: [...cur, ...toAdd] });
      },
      clear: () => set({ selected: [] }),
    }),
    { name: "seat-selection" }
  )
);
