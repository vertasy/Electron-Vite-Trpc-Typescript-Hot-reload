import { useEffect, useState } from "react";
import { trpcClient } from "./trpcClient";
import Router from "./Router/index";
import { Toaster } from "./components/sonner";
import { UploadPopup } from "./Router/pages/components/uploadPopup/UploadPopup";

export default function App() {
  return (
    <>
      <UploadPopup />
      <Router />
      <Toaster />
    </>
  );
}

// function App() {
//   const [stage, setStage] = useState<number | null>(null);

//   useEffect(() => {
//     trpcClient.start.getStatus.query().then(setStage);
//   }, []);

//   if (stage === null) {
//     return <h3></h3>
//   }

//   return <Router stage={stage} />;
// }
