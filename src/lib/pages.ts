// Picks which pages of the site are worth reading for voice and messaging, so the
// guide reflects the whole site (about, product, pricing, customers, blog) and not
// just the homepage hero.

import { hostOf, siteKey } from "./resolve";
import { log } from "./log";

// "section" is a generic page of the site (a hub or an article) picked when none of the named kinds match.
export type PageKind = "about" | "product" | "pricing" | "customers" | "blog" | "careers" | "brand" | "section";

const KIND_PATTERNS: [PageKind, RegExp][] = [
  ["brand", /\/(brand|brand-?guidelines?|press-?kit|media-?kit|logos?|brand-?assets|newsroom\/media)(\/|$)/i],
  ["about", /\/(about|about-us|company|mission|our-story|story|who-we-are|values|purpose|impact|sustainability|activism|our-[a-z-]+)(\/|$)/i],
  ["product", /\/(product|products|features|platform|solutions|how-it-works|why-[a-z-]+|overview|business|enterprise|teams|use-cases|for-[a-z-]+|host)(\/|$)/i],
  ["pricing", /\/(pricing|plans|plans-and-pricing)(\/|$)/i],
  ["customers", /\/(customers|case-studies|customer-stories|stories|testimonials)(\/|$)/i],
  ["blog", /\/(blog|news|newsroom|journal|now|updates|changelog)(\/|$)/i],
  ["careers", /\/(careers|jobs|join-us|work-with-us)(\/|$)/i],
];

const READ_ORDER: PageKind[] = ["about", "product", "pricing", "customers", "blog", "careers", "brand"];

export interface PlannedPage {
  url: string;
  kind: PageKind;
}

export function planPages(homepage: string, links: string[], limit = 6): PlannedPage[] {
  const site = siteKey(hostOf(homepage));
  const bestByKind = new Map<PageKind, string>();

  for (const link of links) {
    let url: URL;
    try {
      url = new URL(link, homepage);
    } catch {
      continue;
    }
    if (siteKey(url.host) !== site) continue;
    // A brand subdomain root ("careers.duolingo.com/", "blog.linear.app/") is a page of its own kind.
    if (url.pathname === "/") {
      const subdomainKind = kindOfSubdomain(url.host, hostOf(homepage));
      if (subdomainKind && !bestByKind.has(subdomainKind)) bestByKind.set(subdomainKind, `${url.protocol}//${url.host}`);
      continue;
    }
    // Locale prefixes ("/en-us/pricing") still count; deep paths ("/blog/2024/a-post") do not.
    const path = url.pathname.replace(/^\/[a-z]{2}(-[a-z]{2})?(?=\/)/i, "");
    if (path.split("/").filter(Boolean).length > 2) continue;

    for (const [kind, pattern] of KIND_PATTERNS) {
      if (!pattern.test(path)) continue;
      const clean = `${url.protocol}//${url.host}${url.pathname}`.replace(/\/$/, "");
      const current = bestByKind.get(kind);
      if (!current || clean.length < current.length) bestByKind.set(kind, clean);
      break;
    }
  }

  const planned = READ_ORDER.filter((kind) => bestByKind.has(kind))
    .map((kind) => ({ kind, url: bestByKind.get(kind)! }))
    .slice(0, limit);
  log("pages.planned", { links: links.length, picked: planned.length, kinds: planned.map((page) => page.kind).join(",") });
  return planned;
}

// Real language codes only: "/ir/" (investor relations) and "/ai/" are sections, not locales.
const LOCALE_PREFIX = /^\/(?:[a-z]{2}-[a-z]{2}|en|fr|de|es|it|pt|nl|ja|ko|zh|ru|pl|sv|da|no|fi|tr|ar|he|cs|hi|id|th|vi)(?=\/|$)/i;
const NOT_COPY_EXTENSION = /\.(pdf|jpe?g|png|gif|webp|svg|avif|mp4|mov|zip|xml|json|csv|docx?|xlsx?|pptx?)$/i;
// Utility pages carry no brand voice: accounts, carts, legal, search, feeds.
const UTILITY_PATH = /\/(login|log-in|signin|sign-in|signup|sign-up|register|account|cart|checkout|search|contact|sitemap|accessibility|privacy|cookies?|terms|legal|legal-notice|imprint|unsubscribe|feed|rss|map)(\/|$|-)/i;

/** How many distinct same-site pages a link list exposes; a low count means Fetch saw a JS-built page. */
export function countSitePages(homepage: string, links: string[]): number {
  return new Set(sitePaths(homepage, links).map((entry) => entry.url)).size;
}

/**
 * Generic fallback for sites whose pages do not use about / product / pricing names (a tourism
 * board, a marketplace, a magazine). Groups same-site links by their first path segment and
 * returns one page per section, standalone top-level pages first, then section hubs by size,
 * then a second page from each section. Links in another locale than the homepage are ignored.
 */
export function planSectionPages(homepage: string, links: string[], exclude: string[] = [], limit = 8): PlannedPage[] {
  const skip = new Set(exclude.map(normalisePageUrl));
  const sections = new Map<string, { url: string; depth: number }[]>();
  for (const entry of sitePaths(homepage, links)) {
    if (skip.has(entry.url)) continue;
    const group = sections.get(entry.section) ?? [];
    if (!group.some((page) => page.url === entry.url)) group.push({ url: entry.url, depth: entry.depth });
    sections.set(entry.section, group);
  }

  // Within a section the shallowest page (the hub) leads; ties keep link order.
  const ranked = [...sections.values()]
    .map((group) => [...group].sort((a, b) => a.depth - b.depth))
    .sort((a, b) => Number(b.length === 1 && b[0].depth === 1) - Number(a.length === 1 && a[0].depth === 1) || b.length - a.length);
  const picked: PlannedPage[] = [];
  for (let round = 0; picked.length < limit && ranked.some((group) => group[round]); round++) {
    for (const group of ranked) if (group[round] && picked.length < limit) picked.push({ url: group[round].url, kind: "section" });
  }
  log("pages.sections", { links: links.length, sections: sections.size, picked: picked.length });
  return picked;
}

function normalisePageUrl(url: string): string {
  return url.replace(/[#?].*$/, "").replace(/\/$/, "");
}

// Same-host, same-locale, copy-bearing pages from a link list, with the path section each belongs to.
function sitePaths(homepage: string, links: string[]): { url: string; section: string; depth: number }[] {
  const home = new URL(homepage);
  const homeLocale = home.pathname.match(LOCALE_PREFIX)?.[0].toLowerCase() ?? "";
  const found: { url: string; section: string; depth: number }[] = [];
  for (const link of links) {
    let url: URL;
    try {
      url = new URL(link, homepage);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(url.protocol) || url.host.replace(/^www\./, "") !== home.host.replace(/^www\./, "")) continue;
    const locale = url.pathname.match(LOCALE_PREFIX)?.[0].toLowerCase() ?? "";
    if (locale !== homeLocale && (locale || homeLocale)) continue;
    const path = url.pathname.slice(locale.length);
    const segments = path.split("/").filter(Boolean);
    if (segments.length === 0 || NOT_COPY_EXTENSION.test(path) || UTILITY_PATH.test(path)) continue;
    found.push({ url: normalisePageUrl(`${url.protocol}//${url.host}${url.pathname}`), section: segments[0].toLowerCase(), depth: segments.length });
  }
  return found;
}

const SUBDOMAIN_KINDS: [RegExp, PageKind][] = [
  [/^(careers|jobs)\./, "careers"],
  [/^(blog|news|newsroom)\./, "blog"],
  [/^(about|company)\./, "about"],
  [/^(brand|design|press)\./, "brand"],
];

function kindOfSubdomain(host: string, homeHost: string): PageKind | null {
  if (host === homeHost) return null;
  return SUBDOMAIN_KINDS.find(([pattern]) => pattern.test(host))?.[1] ?? null;
}
