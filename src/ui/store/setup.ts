// store/setup.ts
import { create } from "zustand";

type SetupState = {
  stage: number | null;
  setStage: (stage: number) => void;
};

export const useSetupStore = create<SetupState>((set) => ({
  stage: null,
  setStage: (stage) => set({ stage })
}));
