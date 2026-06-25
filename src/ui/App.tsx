import { useState } from "react";
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

  async function testMutation() {
    const response = await trpcClient.test.mutate();

    setResult(String(response));
  }

  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}
