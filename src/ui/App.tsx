import { useState } from "react";
import { trpcClient } from "./trpcClient";

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
    <div>
      <button onClick={testQuery}>Query</button>

      <button onClick={testMutation}>Mutation</button>

      <pre>{result}</pre>
    </div>
  );
}
