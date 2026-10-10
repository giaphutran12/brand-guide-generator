"use client";

import { useEffect, useRef, useState } from "react";
import { GuideView } from "./GuideView";
import { elapsed, jobTitle, useJobs, useNow } from "./Jobs";

const ENDPOINT_BADGE: Record<string, string> = { search: "Search", fetch: "Fetch", browser: "Browser", llm: "Model" };

export function Generator() {
  const { jobs, selectedId, focusId, start, select, retry, markSeen, clearFocus } = useJobs();
  const [input, setInput] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);
  const job = jobs.find((candidate) => candidate.id === selectedId) ?? null;
  const now = useNow(job?.status === "running");

  // The guide on screen counts as seen, so the dock stops announcing it.
  useEffect(() => {
    if (job?.status === "done" && !job.seen) markSeen(job.id);
  }, [job?.id, job?.status, job?.seen, markSeen]);

  // Arriving from the dock's "View guide": bring the guide into view.
  useEffect(() => {
    if (!focusId || focusId !== job?.id) return;
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    clearFocus();
  }, [focusId, job?.id, clearFocus]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;
    start(input);
    setInput("");
  }

  return (
    <>
      <form className="generator" onSubmit={submit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="stripe.com, https://www.notion.com, or just “Duolingo”"
          aria-label="Company website or name"
          autoFocus
        />
        <button type="submit" className="button" disabled={!input.trim()}>
          Generate brand guide
        </button>
      </form>

      {jobs.length > 1 && (
        <nav className="runs" aria-label="Your guides">
          <span className="muted small">Your guides</span>
          {jobs.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className={`run-chip ${candidate.status}${candidate.id === selectedId ? " active" : ""}`}
              onClick={() => select(candidate.id)}
              aria-pressed={candidate.id === selectedId}
            >
              <span className="run-dot" aria-hidden />
              {jobTitle(candidate)}
            </button>
          ))}
        </nav>
      )}

      <div ref={resultRef} className="run-anchor">
        {job && job.status !== "done" && (
          <div className="run-status">
            <p className="run-title">
              <strong>{jobTitle(job)}</strong>
              {job.status === "running" && <span className="muted small"> · {elapsed(now - job.startedAt)} elapsed</span>}
            </p>
            {job.events.length > 0 && (
              <ol className="progress" aria-live="polite">
                {job.events.map((event, index) => (
                  <li key={index} className={index === job.events.length - 1 && job.status === "running" ? "current" : ""}>
                    {event.endpoint && <span className={`endpoint ${event.endpoint}`}>{ENDPOINT_BADGE[event.endpoint]}</span>}
                    {event.message}
                  </li>
                ))}
              </ol>
            )}
            {job.status === "running" && (
              <p className="hint">
                Takes about a minute. Feel free to open the example guides or start another brand: this keeps running, and it shows up in the corner when it is ready.
              </p>
            )}
            {job.status === "error" && (
              <div className="error run-error">
                <span>{job.error}</span>
                <button type="button" className="button ghost" onClick={() => retry(job.id)}>
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
        {job?.status === "done" && job.guide && <GuideView guide={job.guide} />}
      </div>
    </>
  );
}
