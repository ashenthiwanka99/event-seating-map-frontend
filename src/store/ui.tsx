"use client";
import { create } from "zustand";

type UIState = {
  heatmap: boolean;
  setHeatmap: (v: boolean) => void;
};

export const useUI = create<UIState>((set) => ({
  heatmap: false,
  setHeatmap: (v) => set({ heatmap: v }),
}));
