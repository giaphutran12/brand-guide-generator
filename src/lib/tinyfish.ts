// Thin wrapper over the TinyFish SDK. Every call is recorded in a ledger so the
// finished guide can show exactly which TinyFish endpoint produced which fact.

import { TinyFish } from "@tiny-fish/sdk";
import type { FetchGetContentsParams, SearchQueryParams } from "@tiny-fish/sdk";
import { log } from "./log";

export type TinyFishEndpoint = "search" | "fetch" | "browser";

export interface TinyFishCall {
  endpoint: TinyFishEndpoint;
  purpose: string;
  input: string;
  ok: boolean;
  ms: number;
  detail: string;
}

export interface FetchedPage {
  url: string;
  finalUrl: string;
  title: string | null;
  description: string | null;
  text: string;
  links: string[];
  imageLinks: string[];
}

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
  siteName: string;
}

let sharedClient: TinyFish | null = null;

function client(): TinyFish {
  if (!process.env.TINYFISH_API_KEY) {
    throw new Error("TINYFISH_API_KEY is not set. Get one at https://agent.tinyfish.ai/api-keys");
  }
  sharedClient ??= new TinyFish();
  return sharedClient;
}

export class TinyFishLedger {
  readonly calls: TinyFishCall[] = [];

  async search(query: string, purpose: string, extra: Partial<SearchQueryParams> = {}): Promise<SearchHit[]> {
    const startedAt = Date.now();
    try {
      const response = await client().search.query({ query, purpose, ...extra });
      const hits = response.results.map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        siteName: result.site_name,
      }));
      this.record("search", purpose, query, true, startedAt, `${hits.length} results`);
      return hits;
    } catch (error) {
      this.record("search", purpose, query, false, startedAt, errorLabel(error));
      throw error;
    }
  }

  async fetch(
    urls: string[],
    purpose: string,
    options: Omit<FetchGetContentsParams, "urls" | "purpose"> = {},
  ): Promise<{ pages: FetchedPage[]; failures: { url: string; error: string }[] }> {
    const startedAt = Date.now();
    try {
      const response = await client().fetch.getContents({
        urls,
        purpose,
        format: "markdown",
        per_url_timeout_ms: 20_000,
        ...options,
      });
      const pages: FetchedPage[] = response.results.map((result) => ({
        url: result.url,
        finalUrl: result.final_url ?? result.url,
        title: result.title,
        description: result.description,
        text: typeof result.text === "string" ? result.text : JSON.stringify(result.text ?? ""),
        links: result.links ?? [],
        imageLinks: result.image_links ?? [],
      }));
      const failures = response.errors.map((failure) => ({ url: failure.url, error: failure.error }));
      const chars = pages.reduce((sum, page) => sum + page.text.length, 0);
      this.record(
        "fetch",
        purpose,
        urls.join(", "),
        pages.length > 0,
        startedAt,
        `${pages.length}/${urls.length} pages, ${chars} chars${failures.length ? `, ${failures.length} failed` : ""}`,
      );
      return { pages, failures };
    } catch (error) {
      this.record("fetch", purpose, urls.join(", "), false, startedAt, errorLabel(error));
      throw error;
    }
  }

  async openBrowser(purpose: string, url: string): Promise<{ sessionId: string; cdpUrl: string }> {
    const startedAt = Date.now();
    try {
      const session = await client().browser.sessions.create({ timeout_seconds: 300 });
      this.record("browser", purpose, url, true, startedAt, `session ${session.session_id}`);
      return { sessionId: session.session_id, cdpUrl: session.cdp_url };
    } catch (error) {
      this.record("browser", purpose, url, false, startedAt, errorLabel(error));
      throw error;
    }
  }

  /** The browser call stays open while the page renders; record what it measured and how long it took. */
  completeLastBrowserCall(detail: string, renderMs: number): void {
    const call = [...this.calls].reverse().find((entry) => entry.endpoint === "browser");
    if (!call) return;
    call.detail = `${call.detail}; ${detail}`;
    call.ms += renderMs;
  }

  private record(endpoint: TinyFishEndpoint, purpose: string, input: string, ok: boolean, startedAt: number, detail: string) {
    const ms = Date.now() - startedAt;
    this.calls.push({ endpoint, purpose, input, ok, ms, detail });
    log(`tinyfish.${endpoint}`, { ok, ms, purpose, detail });
  }
}

function errorLabel(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 200);
}
