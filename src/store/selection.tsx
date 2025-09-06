import { create } from "zustand";
import { persist } from "zustand/middleware";

type SelState = {
  selected: string[];
  toggle: (id: string) => void;
  clear: () => void;
};

export const useSelection = create<SelState>()(
  persist(
    (set, get) => ({
      selected: [],
      toggle: (id) => {
        const cur = get().selected;
        const exists = cur.includes(id);
        if (exists) set({ selected: cur.filter(s => s !== id) });
        else if (cur.length < 8) set({ selected: [...cur, id] });
      },
      clear: () => set({ selected: [] }),
    }),
    { name: "seat-selection" }
  )
);
