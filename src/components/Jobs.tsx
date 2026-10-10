"use client";

// Generation runs live here, in the root layout, not in the home page. Navigating to an example
// guide and back keeps every run streaming, and the dock in the corner shows them on any page.
// Runs are also saved to localStorage so a reload re-attaches to a run (the server dedupes a
// brand already in flight and caches finished guides for an hour).

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { BrandGuide, ProgressEvent } from "@/lib/types";

export type JobStatus = "running" | "done" | "error";

export interface Job {
  id: string;
  input: string;
  status: JobStatus;
  events: ProgressEvent[];
  guide: BrandGuide | null;
  error: string | null;
  startedAt: number;
  finishedAt: number | null;
  seen: boolean;
}

interface JobsApi {
  jobs: Job[];
  selectedId: string | null;
  focusId: string | null;
  start(input: string): void;
  select(id: string): void;
  open(id: string): void;
  clearFocus(): void;
  markSeen(id: string): void;
  dismiss(id: string): void;
  retry(id: string): void;
}

const STORAGE_KEY = "brand-guide-generator.jobs.v1";
const MAX_SAVED = 6;
const REUSE_MS = 60 * 60 * 1000;

const JobsContext = createContext<JobsApi | null>(null);

export function useJobs(): JobsApi {
  const api = useContext(JobsContext);
  if (!api) throw new Error("useJobs must be used inside <JobsProvider>");
  return api;
}

function note(event: string, fields: Record<string, string | number | boolean> = {}) {
  console.info(`[brand-guide] ${event}`, fields);
}

function keyOf(input: string) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

export function jobTitle(job: Job) {
  return job.guide?.brand.name ?? job.input.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

function loadSaved(): Job[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Job[]) : [];
  } catch (error) {
    note("jobs.load_failed", { reason: (error as Error).message.slice(0, 80) });
    return [];
  }
}

function save(jobs: Job[]) {
  // Finished guides carry screenshots (~200 KB each); drop the oldest until it fits the quota.
  let kept = jobs.slice(0, MAX_SAVED);
  while (kept.length > 0) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
      if (kept.length < Math.min(jobs.length, MAX_SAVED)) note("jobs.save_trimmed", { kept: kept.length, total: jobs.length });
      return;
    } catch {
      kept = kept.slice(0, -1);
    }
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
  note("jobs.save_failed", { total: jobs.length, reason: "storage unavailable or full" });
}

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const controllers = useRef(new Map<string, AbortController>());

  const patch = useCallback((id: string, change: (job: Job) => Partial<Job>) => {
    setJobs((previous) => previous.map((job) => (job.id === id ? { ...job, ...change(job) } : job)));
  }, []);

  const stream = useCallback(
    async (id: string, input: string) => {
      const controller = new AbortController();
      controllers.current.set(id, controller);
      const startedAt = Date.now();
      try {
        const response = await fetch("/api/brand-guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Request failed (${response.status})`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finished = false;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines.filter(Boolean)) {
            const message = JSON.parse(line) as ({ type: "progress" } & ProgressEvent) | { type: "result"; guide: BrandGuide } | { type: "error"; message: string };
            if (message.type === "progress") patch(id, (job) => ({ events: [...job.events, message] }));
            if (message.type === "result") {
              finished = true;
              patch(id, () => ({ status: "done", guide: message.guide, finishedAt: Date.now(), error: null }));
              note("job.done", { id, ms: Date.now() - startedAt });
            }
            if (message.type === "error") throw new Error(message.message);
          }
        }
        if (!finished) throw new Error("The connection closed before the guide arrived. Retry to pick it up.");
      } catch (caught) {
        if (controller.signal.aborted) {
          note("job.aborted", { id });
          return;
        }
        const message = caught instanceof Error ? caught.message : String(caught);
        patch(id, () => ({ status: "error", error: message, finishedAt: Date.now() }));
        note("job.failed", { id, reason: message.slice(0, 120) });
      } finally {
        controllers.current.delete(id);
      }
    },
    [patch],
  );

  // Restore saved runs once, and re-attach to any that were still running when the page closed.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return; // Strict Mode runs effects twice in development; resume each run once.
    restored.current = true;
    const saved = loadSaved();
    setJobs(saved);
    setSelectedId(saved[0]?.id ?? null);
    setLoaded(true);
    const resumed = saved.filter((job) => job.status === "running");
    for (const job of resumed) void stream(job.id, job.input);
    note("jobs.restored", { total: saved.length, resumed: resumed.length });
  }, [stream]);

  useEffect(() => {
    if (loaded) save(jobs);
  }, [jobs, loaded]);

  const start = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;
      const key = keyOf(trimmed);
      const existing = jobs.find(
        (job) => keyOf(job.input) === key && (job.status === "running" || (job.status === "done" && Date.now() - (job.finishedAt ?? 0) < REUSE_MS)),
      );
      if (existing) {
        setSelectedId(existing.id);
        note("job.reused", { id: existing.id, status: existing.status });
        return;
      }
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const job: Job = { id, input: trimmed, status: "running", events: [], guide: null, error: null, startedAt: Date.now(), finishedAt: null, seen: false };
      setJobs((previous) => [job, ...previous]);
      setSelectedId(id);
      note("job.start", { id, inputChars: trimmed.length });
      void stream(id, trimmed);
    },
    [jobs, stream],
  );

  const retry = useCallback(
    (id: string) => {
      const job = jobs.find((candidate) => candidate.id === id);
      if (!job) return;
      patch(id, () => ({ status: "running", events: [], error: null, startedAt: Date.now(), finishedAt: null, seen: false }));
      note("job.retry", { id });
      void stream(id, job.input);
    },
    [jobs, patch, stream],
  );

  const dismiss = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    setJobs((previous) => previous.filter((job) => job.id !== id));
    setSelectedId((current) => (current === id ? null : current));
    note("job.dismissed", { id });
  }, []);

  const api = useMemo<JobsApi>(
    () => ({
      jobs,
      selectedId,
      focusId,
      start,
      retry,
      dismiss,
      select: (id) => setSelectedId(id),
      open: (id) => {
        setSelectedId(id);
        setFocusId(id);
      },
      clearFocus: () => setFocusId(null),
      markSeen: (id) => patch(id, () => ({ seen: true })),
    }),
    [jobs, selectedId, focusId, start, retry, dismiss, patch],
  );

  return <JobsContext.Provider value={api}>{children}</JobsContext.Provider>;
}

export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}

export function elapsed(ms: number) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// A run emits about ten progress events; the bar is a rough guide, never shown as complete early.
export function progressShare(job: Job) {
  if (job.status !== "running") return 1;
  return Math.min(0.92, 0.06 + job.events.length / 11);
}

const DOCK_LIMIT = 3;

/** Floating panel, bottom right: running runs and finished ones not looked at yet. */
export function JobDock() {
  const { jobs, selectedId, open, dismiss, retry } = useJobs();
  const pathname = usePathname();
  const router = useRouter();
  const now = useNow(jobs.some((job) => job.status === "running"));
  const onHome = pathname === "/";

  const shown = jobs.filter((job) => (job.status === "running" || !job.seen) && !(onHome && job.id === selectedId));
  if (shown.length === 0) return null;

  const view = (id: string) => {
    open(id);
    if (!onHome) router.push("/");
  };

  return (
    <aside className="dock" aria-label="Brand guides in progress" aria-live="polite">
      {shown.slice(0, DOCK_LIMIT).map((job) => {
        const last = job.events[job.events.length - 1];
        const palette = job.guide?.colors.palette.slice(0, 5) ?? [];
        return (
          <div key={job.id} className={`dock-card ${job.status}`}>
            <div className="dock-head">
              {job.status === "running" && <span className="dock-spinner" aria-hidden />}
              {job.status === "done" && (
                <span className="dock-swatches" aria-hidden>
                  {palette.map((color) => (
                    <i key={color.hex + color.role} style={{ background: color.hex }} />
                  ))}
                </span>
              )}
              {job.status === "error" && <span className="dock-dot" aria-hidden />}
              <strong>{jobTitle(job)}</strong>
              <span className="dock-time">{elapsed((job.finishedAt ?? now) - job.startedAt)}</span>
              {job.status !== "running" && (
                <button type="button" className="dock-x" onClick={() => dismiss(job.id)} aria-label={`Dismiss ${jobTitle(job)}`}>
                  ×
                </button>
              )}
            </div>
            <p className="dock-message">
              {job.status === "running" && (last?.message ?? "Starting…")}
              {job.status === "done" && "Brand guide ready"}
              {job.status === "error" && job.error}
            </p>
            {job.status === "running" && (
              <div className="dock-bar">
                <i style={{ width: `${progressShare(job) * 100}%` }} />
              </div>
            )}
            {job.status === "running" && !(onHome && job.id === selectedId) && (
              <button type="button" className="dock-link" onClick={() => view(job.id)}>
                Watch progress
              </button>
            )}
            {job.status === "done" && (
              <button type="button" className="button dock-action" onClick={() => view(job.id)}>
                View guide →
              </button>
            )}
            {job.status === "error" && (
              <button type="button" className="button ghost dock-action" onClick={() => retry(job.id)}>
                Retry
              </button>
            )}
          </div>
        );
      })}
      {shown.length > DOCK_LIMIT && (
        <Link href="/" className="dock-more">
          +{shown.length - DOCK_LIMIT} more on the home page
        </Link>
      )}
    </aside>
  );
}
