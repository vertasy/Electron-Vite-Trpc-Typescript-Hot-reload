import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation
} from "react-router-dom";
import { useEffect, useState } from "react";

import { trpcClient } from "../trpcClient";
import { v4 as uuid } from "uuid";
import Home from "./pages/Home";
import Start from "./pages/start/Start";
import CodeSetupPage from "./pages/start/CodeSetup";
import PinPage from "./pages/start/pin";
import { useAuthStore } from "../store/auth";
import { useSetupStore } from "../store/setup";
import About from "./pages/About";
import DashboardLayout from "./pages/DashboardLayout";
import { PasteImageListener } from "./pages/components/pasteWrapper";
import { useImagePaste } from "./hooks/usePastedImage";
import { useUploadStore } from "../store/upload";

function AppWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const unlocked = useAuthStore((state) => state.unlocked);
  const [loading, setLoading] = useState(true);
  const stage = useSetupStore((s) => s.stage);
  const setStage = useSetupStore((s) => s.setStage);

  // ---- Paste image handler ----
  const handlePastedImage = (file: File, dataUrl: string) => {
    console.log("📋 Pasted image:", file.name, file.size);

    // Convert to Uint8Array for your chunker
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);

      // Now you can enqueue a chunk job – example:
      // const fileId = crypto.randomUUID();
      // RawFilesChunker(uint8Array, fileId, true, 'png', 1);
    };
    reader.readAsArrayBuffer(file);

    // Or store it in a Zustand store for later use
    // useImageStore.getState().addImage(file, dataUrl);
  };

  // Register the paste listener globally inside this wrapper
  useImagePaste(handlePastedImage, []);

  // Existing setup check
  useEffect(() => {
    async function check() {
      const result = await trpcClient.start.getStaus.query();
      setStage(result);
      setLoading(false);
    }
    check();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  // ---- Redirect logic (unchanged) ----
  if (stage === 0 && location.pathname !== "/start") {
    return <Navigate to="/start" replace />;
  }
  if (stage === 1 && location.pathname !== "/start/code-setup") {
    return <Navigate to="/start/code-setup" replace />;
  }
  if (stage === 2 && !unlocked && location.pathname !== "/start/pin") {
    return <Navigate to="/start/pin" replace />;
  }
  if (stage === 2 && unlocked && location.pathname.startsWith("/start")) {
    return <Navigate to="/" replace />;
  }

  // All checks passed → render the actual children
  return <>{children}</>;
}

export default function Router() {
  const { addFile } = useUploadStore();
  const handlePastedImage = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const id = uuid();
    addFile({
      id,
      type: "raw",
      name: file.name,
      data: uint8Array,
      file,
      mimeType: file.type
    });
  };
  return (
    <HashRouter>
      <PasteImageListener onImagePaste={handlePastedImage}>
        <AppWrapper>
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/start" element={<Start />} />
            <Route path="/start/code-setup" element={<CodeSetupPage />} />
            <Route path="/start/pin" element={<PinPage />} />
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Home />} />
              {/* <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/profile" element={<Profile />} /> */}
            </Route>
          </Routes>
        </AppWrapper>
      </PasteImageListener>
    </HashRouter>
  );
}
