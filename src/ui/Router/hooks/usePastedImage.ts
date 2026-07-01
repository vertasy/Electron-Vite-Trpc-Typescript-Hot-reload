// hooks/useImagePaste.ts
import { useEffect, useRef, useCallback } from "react";

type ImagePasteHandler = (file: File, dataUrl: string) => void;

export function useImagePaste(
  onPasteImage: ImagePasteHandler,
  deps: React.DependencyList = []
) {
  const handlerRef = useRef<ImagePasteHandler>(onPasteImage);

  // Keep callback ref updated without resetting the listener
  useEffect(() => {
    handlerRef.current = onPasteImage;
  }, [onPasteImage, ...deps]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only process when the window/tab is focused
      if (!document.hasFocus()) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;

          // Convert to data URL for convenience (optional)
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            handlerRef.current(file, dataUrl);
          };
          reader.readAsDataURL(file);
          break; // Process only the first image found
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);
}
