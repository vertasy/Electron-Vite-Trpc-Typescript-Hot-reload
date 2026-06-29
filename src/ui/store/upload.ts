// uploadStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UploadStatus =
  | "idle"
  | "preparing"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

type UploadSettings = {
  isEncrypted: boolean;
  aiCaptioning: boolean;
};

type UploadState = {
  isOpen: boolean;

  files: UploadedFile[];

  // Upload state
  status: UploadStatus;
  progress: number;

  processed: number;
  total: number;

  currentBatch: number;
  totalBatches: number;

  error?: string;

  // Settings
  isEncrypted: boolean;
  aiCaptioning: boolean;

  settings: UploadSettings;

  // UI
  open: () => void;
  close: () => void;

  // Files
  addFile: (file: UploadedFile) => void;
  addFiles: (files: UploadedFile[]) => void;
  removeFile: (id: string) => void;
  clear: () => void;

  // Upload
  setUploadState: (
    updates: Partial<{
      status: UploadStatus;
      progress: number;
      processed: number;
      total: number;
      currentBatch: number;
      totalBatches: number;
      error?: string;
    }>
  ) => void;

  resetUpload: () => void;

  // Settings
  setEncrypted: (value: boolean) => void;
  setAiCaptioning: (value: boolean) => void;
};

export const useUploadStore = create<UploadState>()(
  persist(
    (set) => ({
      isOpen: true,

      files: [],

      status: "idle",
      progress: 0,

      processed: 0,
      total: 0,

      currentBatch: 0,
      totalBatches: 0,

      error: undefined,

      isEncrypted: false,
      aiCaptioning: true,

      settings: {
        isEncrypted: false,
        aiCaptioning: true
      },

      // UI
      open: () => set({ isOpen: true }),

      close: () => set({ isOpen: false }),

      // Files
      addFile: (file) =>
        set((state) => ({
          files: [...state.files, file]
        })),

      addFiles: (files) =>
        set((state) => ({
          files: [...state.files, ...files]
        })),

      removeFile: (id) =>
        set((state) => ({
          files: state.files.filter((file) => file.id !== id)
        })),

      clear: () =>
        set({
          files: []
        }),

      // Upload
      setUploadState: (updates) =>
        set(() => ({
          ...updates
        })),

      resetUpload: () =>
        set({
          status: "idle",
          progress: 0,

          processed: 0,
          total: 0,

          currentBatch: 0,
          totalBatches: 0,

          error: undefined
        }),

      // Settings
      setEncrypted: (value) =>
        set((state) => ({
          isEncrypted: value,
          settings: {
            ...state.settings,
            isEncrypted: value
          }
        })),

      setAiCaptioning: (value) =>
        set((state) => ({
          aiCaptioning: value,
          settings: {
            ...state.settings,
            aiCaptioning: value
          }
        }))
    }),
    {
      name: "upload-settings",

      partialize: (state) => ({
        isEncrypted: state.isEncrypted,
        aiCaptioning: state.aiCaptioning,
        settings: state.settings
      })
    }
  )
);
