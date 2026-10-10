// POST /api/brand-guide            {"input": "stripe.com"}  -> NDJSON stream: progress events, then the guide
// GET  /api/brand-guide?input=...&format=json|tokens|css|tailwind|md  -> one finished export (for tools and scripts)

import { exportGuide, EXPORTS, type ExportFormat } from "@/lib/exporters";
import { generateBrandGuide } from "@/lib/guide";
import { log } from "@/lib/log";
import type { BrandGuide, ProgressEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const CACHE_TTL_MS = 60 * 60 * 1000;
const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: Number(process.env.RATE_LIMIT_PER_HOUR ?? 8) };

const cache = new Map<string, { guide: BrandGuide; at: number }>();
const inFlight = new Map<string, Promise<BrandGuide>>();
const requestsByClient = new Map<string, number[]>();

function cacheKey(input: string) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

function validateInput(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length < 2 || trimmed.length > 200) return null;
  if (/(^|\/\/)(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[::1\])/i.test(trimmed)) return null;
  if (/^[a-z]+:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

function rateLimited(request: Request): boolean {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (requestsByClient.get(client) ?? []).filter((at) => now - at < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) {
    log("api.rate_limited", { recent: recent.length });
    return true;
  }
  requestsByClient.set(client, [...recent, now]);
  return false;
}

function getOrGenerate(input: string, onProgress: (event: ProgressEvent) => void): Promise<BrandGuide> {
  const key = cacheKey(input);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    log("api.cache_hit", { key });
    onProgress({ stage: "done", message: "Served from cache (generated within the last hour)" });
    return Promise.resolve(cached.guide);
  }
  const running = inFlight.get(key);
  if (running) {
    onProgress({ stage: "queue", message: "Same brand is already being generated; waiting for it" });
    return running;
  }
  const job = generateBrandGuide(input, onProgress)
    .then((guide) => {
      cache.set(key, { guide, at: Date.now() });
      return guide;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, job);
  return job;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { input?: unknown };
  const input = validateInput(body.input);
  if (!input) return Response.json({ error: "Send {\"input\": \"<company URL or name>\"}." }, { status: 400 });
  // Re-attaching to a run already in flight (a reload) costs nothing, so it does not count.
  if (!cache.has(cacheKey(input)) && !inFlight.has(cacheKey(input)) && rateLimited(request)) {
    return Response.json({ error: "Rate limit reached for this demo. Try an example guide, or run it locally." }, { status: 429 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // A visitor who closes the tab or reloads must not kill the run: keep generating so the guide
      // lands in the cache, and a reload that re-attaches gets it from there.
      let open = true;
      const send = (payload: unknown) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
        } catch {
          open = false;
          log("api.client_gone", { reason: "stream closed by the client; generation continues for the cache" });
        }
      };
      try {
        const guide = await getOrGenerate(input, (event) => send({ type: "progress", ...event }));
        send({ type: "result", guide });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log("api.failed", { reason: message.slice(0, 160) });
        send({ type: "error", message });
      } finally {
        if (open) controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const input = validateInput(params.get("input"));
  const format = (params.get("format") ?? "json") as ExportFormat;
  if (!input) return Response.json({ error: "Use ?input=<company URL or name>&format=json|tokens|css|tailwind|md" }, { status: 400 });
  if (!(format in EXPORTS)) return Response.json({ error: `Unknown format. Use one of: ${Object.keys(EXPORTS).join(", ")}` }, { status: 400 });
  if (!cache.has(cacheKey(input)) && rateLimited(request)) return Response.json({ error: "Rate limit reached." }, { status: 429 });

  try {
    const guide = await getOrGenerate(input, () => {});
    return new Response(exportGuide(guide, format), {
      headers: { "Content-Type": `${EXPORTS[format].contentType}; charset=utf-8`, "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("api.failed", { reason: message.slice(0, 160), format });
    return Response.json({ error: message }, { status: 502 });
  }
}
