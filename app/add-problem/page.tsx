"use client";

import { useState } from "react";

export default function CreateProblemPage() {
  const [jsonText, setJsonText] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setResponse(null);

    try {
      const parsed = JSON.parse(jsonText);

      const res = await fetch("/api/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON format");
      } else {
        setError("Something went wrong");
      }
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1>Create Problem</h1>

      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder="Paste problem JSON here"
        rows={25}
        style={{
          width: "100%",
          fontFamily: "monospace",
          fontSize: 14,
          padding: 12,
        }}
      />

      <button
        onClick={handleSubmit}
        style={{
          marginTop: 12,
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
        Submit
      </button>

      {error && <pre style={{ color: "red", marginTop: 16 }}>{error}</pre>}

      {response && <pre style={{ marginTop: 16 }}>{response}</pre>}
    </div>
  );
}
