import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation
} from "react-router-dom";
import { useEffect, useState } from "react";

import { trpcClient } from "../trpcClient";

import Home from "./pages/Home";
import Start from "./pages/start/Start";
import CodeSetupPage from "./pages/start/CodeSetup";
import PinPage from "./pages/start/pin";
import { useAuthStore } from "../store/auth";
import { useSetupStore } from "../store/setup";
import About from "./pages/About";

function AppWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const unlocked = useAuthStore((state) => state.unlocked);

  const [loading, setLoading] = useState(true);
  const stage = useSetupStore((s) => s.stage);
  const setStage = useSetupStore((s) => s.setStage);

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

  // Initial setup
  if (stage === 0 && location.pathname !== "/start") {
    return <Navigate to="/start" replace />;
  }

  // Create PIN
  if (stage === 1 && location.pathname !== "/start/code-setup") {
    return <Navigate to="/start/code-setup" replace />;
  }

  // PIN exists but not unlocked
  if (stage === 2 && !unlocked && location.pathname !== "/start/pin") {
    return <Navigate to="/start/pin" replace />;
  }

  // Already unlocked
  if (stage === 2 && unlocked && location.pathname.startsWith("/start")) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function Router() {
  return (
    <HashRouter>
      <AppWrapper>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/start" element={<Start />} />
          <Route path="/start/code-setup" element={<CodeSetupPage />} />
          <Route path="/start/pin" element={<PinPage />} />
        </Routes>
      </AppWrapper>
    </HashRouter>
  );
}
