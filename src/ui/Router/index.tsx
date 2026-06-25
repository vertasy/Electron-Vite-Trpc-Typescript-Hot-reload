import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthGuard from "../middleware/AuthGuard";
import Home from "./pages/Home";
import Start from "./pages/start/Start";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}

        <Route path="/start" element={<Start />} />

        <Route
          path="/"
          element={
            <AuthGuard>
              <Home />
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
