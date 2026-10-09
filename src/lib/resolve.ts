// Turns whatever the user typed ("stripe.com", "https://www.notion.so/product", "Duolingo")
// into the brand's homepage. Company names go through TinyFish Search.

import { log } from "./log";
import type { TinyFishLedger } from "./tinyfish";

export interface ResolvedSite {
  input: string;
  homepage: string;
  host: string;
  nameGuess: string;
  resolvedBy: "url" | "search";
}

// Results on these hosts describe a company but are never its own site.
const NOT_A_BRAND_SITE = [
  "wikipedia.org", "linkedin.com", "x.com", "twitter.com", "facebook.com", "instagram.com",
  "youtube.com", "tiktok.com", "reddit.com", "crunchbase.com", "bloomberg.com", "glassdoor.com",
  "apps.apple.com", "play.google.com", "github.com", "medium.com", "merriam-webster.com",
  "dictionary.com", "cambridge.org", "britannica.com", "forbes.com", "pitchbook.com", "g2.com",
  "trustpilot.com", "yelp.com", "amazon.com", "indeed.com", "zoominfo.com", "news.ycombinator.com",
];

export function looksLikeUrl(input: string): boolean {
  const trimmed = input.trim();
  return /^https?:\/\//i.test(trimmed) || (/^[^\s/]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed) && !trimmed.includes(" "));
}

export async function resolveSite(input: string, tinyfish: TinyFishLedger): Promise<ResolvedSite> {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Give me a company URL or name.");

  if (looksLikeUrl(trimmed)) {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const homepage = `${url.protocol}//${url.host}/`;
    log("resolve.url", { host: url.host });
    return { input: trimmed, homepage, host: url.host, nameGuess: nameFromHost(url.host), resolvedBy: "url" };
  }

  const hits = await tinyfish.search(`${trimmed} official website`, "Find the company's official homepage");
  const nameTokens = trimmed.toLowerCase().split(/\s+/).filter((token) => token.length > 1);
  const candidates = hits.filter((hit) => !isNotABrandSite(hostOf(hit.url)));
  const best =
    candidates.find((hit) => nameTokens.some((token) => hostOf(hit.url).includes(token.replace(/[^a-z0-9]/g, "")))) ??
    candidates[0];

  if (!best) {
    log("resolve.search_miss", { results: hits.length, reason: "every result was a directory or social site" });
    throw new Error(`Couldn't find an official website for "${trimmed}". Try passing its URL.`);
  }

  const url = new URL(best.url);
  log("resolve.search_hit", {
    host: url.host,
    results: hits.length,
    skipped: hits.length - candidates.length,
    matchedName: nameTokens.some((token) => url.host.includes(token.replace(/[^a-z0-9]/g, ""))),
  });
  return { input: trimmed, homepage: `${url.protocol}//${url.host}/`, host: url.host, nameGuess: trimmed, resolvedBy: "search" };
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return "";
  }
}

/** "www.stripe.com" -> "stripe.com"; good enough for same-site checks without a public-suffix list. */
export function siteKey(host: string): string {
  const parts = host.replace(/^www\./, "").split(".");
  const secondLevel = parts.at(-2) ?? "";
  const keep = ["co", "com", "org", "net", "gov", "ac"].includes(secondLevel) && parts.length > 2 ? 3 : 2;
  return parts.slice(-keep).join(".");
}

function isNotABrandSite(host: string): boolean {
  return NOT_A_BRAND_SITE.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

function nameFromHost(host: string): string {
  const label = siteKey(host).split(".")[0] ?? host;
  return label.charAt(0).toUpperCase() + label.slice(1);
}
