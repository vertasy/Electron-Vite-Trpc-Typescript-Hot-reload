import { Navigate } from "react-router-dom";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const isLoggedIn = false;

  if (!isLoggedIn) {
    return <Navigate to="/start" replace />;
  }

  return children;
}
