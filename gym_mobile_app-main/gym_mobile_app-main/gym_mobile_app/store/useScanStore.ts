import { create } from "zustand";
import { ScanResult, PPGPoint } from "../types/ppg";

type ScanStore = {
  latest: ScanResult | null;
  ppg: PPGPoint[];
  setLatest: (r: ScanResult) => void;
  setPPG: (data: PPGPoint[]) => void;
  clear: () => void;
};

export const useScanStore = create<ScanStore>((set) => ({
  latest: null,
  ppg: [],
  setLatest: (r) => set({ latest: r }),
  setPPG: (data) => set({ ppg: data }),
  clear: () => set({ latest: null, ppg: [] }),
}));
