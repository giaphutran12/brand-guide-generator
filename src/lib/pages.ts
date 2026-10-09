// Picks which pages of the site are worth reading for voice and messaging, so the
// guide reflects the whole site (about, product, pricing, customers, blog) and not
// just the homepage hero.

import { hostOf, siteKey } from "./resolve";
import { log } from "./log";

export type PageKind = "about" | "product" | "pricing" | "customers" | "blog" | "careers" | "brand";

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
