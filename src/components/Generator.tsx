"use client";

import { useState } from "react";
import type { BrandGuide, ProgressEvent } from "@/lib/types";
import { GuideView } from "./GuideView";

type Status = "idle" | "running" | "done" | "error";

const ENDPOINT_BADGE: Record<string, string> = { search: "Search", fetch: "Fetch", browser: "Browser", llm: "Model" };

export function Generator() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [guide, setGuide] = useState<BrandGuide | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim() || status === "running") return;
    setStatus("running");
    setEvents([]);
    setGuide(null);
    setError(null);

    try {
      const response = await fetch("/api/brand-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed (${response.status})`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines.filter(Boolean)) {
          const message = JSON.parse(line) as ({ type: "progress" } & ProgressEvent) | { type: "result"; guide: BrandGuide } | { type: "error"; message: string };
          if (message.type === "progress") setEvents((previous) => [...previous, message]);
          if (message.type === "result") {
            setGuide(message.guide);
            setStatus("done");
          }
          if (message.type === "error") throw new Error(message.message);
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      setStatus("error");
    }
  }

  return (
    <>
      <form className="generator" onSubmit={run}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="stripe.com, https://www.notion.com, or just “Duolingo”"
          aria-label="Company website or name"
          autoFocus
        />
        <button type="submit" className="button" disabled={status === "running" || !input.trim()}>
          {status === "running" ? "Extracting…" : "Generate brand guide"}
        </button>
      </form>

      {events.length > 0 && status !== "done" && (
        <ol className="progress" aria-live="polite">
          {events.map((event, index) => (
            <li key={index} className={index === events.length - 1 && status === "running" ? "current" : ""}>
              {event.endpoint && <span className={`endpoint ${event.endpoint}`}>{ENDPOINT_BADGE[event.endpoint]}</span>}
              {event.message}
            </li>
          ))}
        </ol>
      )}
      {status === "running" && <p className="muted small">A full guide takes about a minute: the browser render and the voice analysis run in parallel.</p>}
      {error && <p className="error">{error}</p>}
      {guide && <GuideView guide={guide} />}
    </>
  );
}
