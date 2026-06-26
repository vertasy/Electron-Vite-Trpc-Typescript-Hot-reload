import { useEffect, useState } from "react";
import { trpcClient } from "./trpcClient";
import Router from "./Router/index";
import { Toaster } from "./components/sonner";

export default function App() {
  const [result, setResult] = useState("");

  async function testQuery() {
    const response = await trpcClient.double.query({
      name: "Diaa"
    });

    setResult(response.greeting);
  }

  return (
    <>
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
