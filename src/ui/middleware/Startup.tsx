import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { trpcClient } from "../trpcClient";

export default function StartGuard({
  children
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    async function check() {
      const stage = await trpcClient.start.getStaus.query();

      if (stage === 0) {
        navigate("/start", { replace: true });
      } else if (stage === 1) {
        navigate("/start/code-setup", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }

    check();
  }, [navigate]);

  return <>{children}</>;
}
