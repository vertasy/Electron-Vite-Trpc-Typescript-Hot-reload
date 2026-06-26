import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import { useEffect, useState } from "react";

import { trpcClient } from "../trpcClient";

import Home from "./pages/Home";
import Start from "./pages/start/Start";
import CodeSetupPage from "./pages/start/CodeSetup";

function AppWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const [stage, setStage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setLoading(true);

      try {
        const result = await trpcClient.start.getStaus.query();
        console.log(result);
        if (!cancelled) {
          setStage(result);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        Loading...
      </div>
    );
  }

  if (stage === 0 && location.pathname !== "/start") {
    return <Navigate to="/start" replace />;
  }

  if (stage === 1 && location.pathname !== "/start/code-setup") {
    return <Navigate to="/start/code-setup" replace />;
  }

  if (stage === 2 && location.pathname !== "/") {
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
          <Route path="/start" element={<Start />} />
          <Route path="/start/code-setup" element={<CodeSetupPage />} />
        </Routes>
      </AppWrapper>
    </HashRouter>
  );
}
