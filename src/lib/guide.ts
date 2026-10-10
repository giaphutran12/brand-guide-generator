// The pipeline. One input (URL or company name) in, one structured brand guide out.
//
//   Search  -> resolve a company name to its site; find its brand / press-kit pages
//   Fetch   -> read homepage + about, product, pricing, customers, blog, brand pages
//   Browser -> render the homepage to measure real colours, fonts, buttons and the logo
//   Model   -> write voice and messaging from the fetched copy, then verify every quote

import { cleanPages, measureWriting, type CorpusPage } from "./corpus";
import { log } from "./log";
import { planPages, type PageKind } from "./pages";
import { buildPalette } from "./palette";
import { readPagesInBrowser, renderSite, type RenderedSite } from "./render";
import { hostOf, resolveSite, siteKey } from "./resolve";
import { TinyFishLedger, type FetchedPage } from "./tinyfish";
import type { BrandGuide, ProgressEvent } from "./types";
import { buildTypography } from "./typography";
import { analyseVoice } from "./voice";

// Matched against the URL path only: titles like "What is a visual identity?" are SEO articles.
const BRAND_PAGE_PATH = /\/(brand|brand-?guidelines?|brand-?assets|brand-?resources|press|press-?kit|media-?kit|media|logos?|identity|newsroom)(\/|$|-|\.)/i;
const ARTICLE_PATH = /\/(blog|resources|guides|learn|articles?|posts?|insights)\//i;

export async function generateBrandGuide(input: string, onProgress: (event: ProgressEvent) => void = () => {}): Promise<BrandGuide> {
  const startedAt = Date.now();
  const tinyfish = new TinyFishLedger();
  const warnings: string[] = [];
  log("guide.start", { inputChars: input.length });

  // No endpoint badge yet: a URL input never calls Search. The next event carries it when Search ran.
  onProgress({ stage: "resolve", message: `Finding the official site for "${input}"` });
  const site = await resolveSite(input, tinyfish);
  onProgress({ stage: "resolve", message: `Using ${site.homepage}`, endpoint: site.resolvedBy === "search" ? "search" : undefined });

  onProgress({ stage: "render", message: "Opening a TinyFish browser to render the live homepage", endpoint: "browser" });
  const rendering: Promise<RenderedSite | null> = renderSite(site.homepage, tinyfish)
    .then((rendered) => {
      onProgress({ stage: "render", message: `Measured ${rendered.styles.elementCount} elements, ${rendered.styles.fontFiles.length} font files, logo ${rendered.styles.logo ? "found" : "not found"}`, endpoint: "browser" });
      return rendered;
    })
    .catch((error: Error) => {
      warnings.push(`Rendering failed (${error.message.slice(0, 120)}); colours and fonts are unavailable.`);
      log("guide.render_failed", { reason: error.message.slice(0, 160) });
      onProgress({ stage: "render", message: "Browser render failed; continuing with page content only", endpoint: "browser" });
      return null;
    });

  onProgress({ stage: "read", message: "Reading the homepage with TinyFish Fetch", endpoint: "fetch" });
  const home = await tinyfish.fetch([site.homepage], "Read homepage copy, links and images for a brand guide", { links: true, image_links: true });
  const fetchedHome = home.pages[0];
  const homeUrl = fetchedHome?.finalUrl || site.homepage;
  let homeText = fetchedHome?.text ?? "";
  let homeLinks = fetchedHome?.links ?? [];
  let homeVia: "fetch" | "browser" = "fetch";
  if (homeText.length < 200) {
    // Client-rendered or bot-walled homepages give Fetch nothing; the rendered page still has the copy.
    log("guide.home_text_thin", { chars: homeText.length, reason: home.failures[0]?.error ?? "homepage is mostly client-rendered" });
    onProgress({ stage: "read", message: "Fetch got almost no text from the homepage; using the copy from the rendered page instead", endpoint: "browser" });
    const renderedHome = await rendering;
    if (renderedHome && renderedHome.styles.visibleText.length > homeText.length) {
      homeText = renderedHome.styles.visibleText;
      homeLinks = [...homeLinks, ...renderedHome.styles.links];
      homeVia = "browser";
      warnings.push("The homepage could not be read by Fetch, so its copy was taken from the rendered page.");
    }
  }
  if (!homeText) throw new Error(`Could not read ${site.homepage}: ${home.failures[0]?.error ?? "no content"}`);

  const planned = planPages(homeUrl, homeLinks);
  if (planned.length < 3) {
    // JS-heavy homepages expose few links to Fetch; ask Search for the site's own key pages instead.
    onProgress({ stage: "search", message: "Homepage links are sparse; searching the site for its about, product and careers pages", endpoint: "search" });
    const siteHits = await tinyfish
      .search(`${site.nameGuess} about mission products careers`, "Find the site's about, product, pricing and careers pages", { include_domains: siteKey(site.host) })
      .catch(() => []);
    const known = new Set(planned.map((page) => page.kind));
    const extra = planPages(homeUrl, siteHits.map((hit) => hit.url)).filter((page) => !known.has(page.kind));
    planned.push(...extra.slice(0, 6 - planned.length));
    log("guide.page_search_fallback", { hits: siteHits.length, added: extra.length });
  }
  onProgress({ stage: "search", message: "Searching the site for brand guidelines or a press kit", endpoint: "search" });
  const brandHits = await tinyfish
    .search(`${site.nameGuess} brand guidelines logo colors press kit`, "Find official brand assets and guidelines", { include_domains: siteKey(site.host) })
    .catch(() => []);
  const brandUrls = brandHits
    .filter((hit) => siteKey(hostOf(hit.url)) === siteKey(site.host) && isBrandPage(hit.url))
    .map((hit) => hit.url.replace(/[#?].*$/, ""))
    .filter((url) => !planned.some((page) => page.url === url.replace(/\/$/, "")))
    .slice(0, 2);
  log("guide.brand_pages", { searched: brandHits.length, kept: brandUrls.length });

  const toRead = [...planned, ...brandUrls.map((url) => ({ url, kind: "brand" as PageKind }))];
  let subPages: FetchedPage[] = [];
  const browserRead: string[] = [];
  if (toRead.length > 0) {
    onProgress({ stage: "read", message: `Reading ${toRead.length} more pages: ${toRead.map((page) => page.kind).join(", ")}`, endpoint: "fetch" });
    const fetched = await tinyfish.fetch(toRead.map((page) => page.url), "Read site pages for tone of voice, messaging and brand rules");
    subPages = fetched.pages.filter((page) => page.text.length >= 200);
    const unread = toRead.map((page) => page.url).filter((url) => !subPages.some((page) => page.url === url || page.url === `${url}/`));
    if (unread.length > 0) {
      onProgress({ stage: "read", message: `Fetch could not read ${unread.length} page(s); reading them in the TinyFish browser`, endpoint: "browser" });
      const viaBrowser = await readPagesInBrowser(unread.slice(0, 3), tinyfish).catch((error: Error) => {
        log("guide.browser_read_failed", { reason: error.message.slice(0, 160) });
        return [];
      });
      browserRead.push(...viaBrowser.map((page) => page.url));
      subPages.push(...viaBrowser.map((page) => ({ url: page.url, finalUrl: page.url, title: page.title, description: null, text: page.text, links: [], imageLinks: [] })));
      for (const url of unread.filter((url) => !browserRead.includes(url))) warnings.push(`Could not read ${url} with Fetch or the browser.`);
    }
  }

  const kindOf = (url: string) => toRead.find((page) => page.url === url || page.url === url.replace(/\/$/, ""))?.kind ?? "product";
  const corpus: CorpusPage[] = cleanPages([
    { url: site.homepage, kind: "home", title: fetchedHome?.title ?? null, text: homeText, via: homeVia },
    ...subPages.map((page) => ({ url: page.url, kind: kindOf(page.url), title: page.title, text: page.text, via: browserRead.includes(page.url) ? ("browser" as const) : ("fetch" as const) })),
  ]);
  const metrics = measureWriting(corpus);

  onProgress({ stage: "voice", message: `Analysing tone of voice across ${corpus.length} pages (${metrics.wordsAnalysed} words)`, endpoint: "llm" });
  const [voice, rendered] = await Promise.all([
    analyseVoice({ brandHint: site.nameGuess, pages: corpus, metrics }),
    rendering,
  ]);
  const ctasSeen = [...new Set(rendered?.styles.ctas.map((cta) => cta.text) ?? [])].slice(0, 12);
  onProgress({ stage: "voice", message: `Kept ${voice.verification.quotesKept} verbatim quotes, dropped ${voice.verification.quotesDropped} that were not on the pages`, endpoint: "llm" });

  const colors = rendered ? buildPalette(rendered.styles, voice.officialColors) : { palette: [], pairings: [], cssVariables: [] };
  const primaryHex = colors.palette.find((color) => color.role === "primary")?.hex ?? null;
  const typography = rendered ? buildTypography(rendered.styles, primaryHex) : { families: [], scale: [] };
  for (const font of voice.officialFonts) {
    const match = typography.families.find((family) => family.name.toLowerCase().includes(font.name.toLowerCase().split(" ")[0]));
    if (!match) warnings.push(`The brand page names the font "${font.name}" but the homepage does not load it.`);
  }

  const styles = rendered?.styles;
  const logo = styles?.logo;
  const guide: BrandGuide = {
    schema: "brand-guide/v1",
    generatedAt: new Date().toISOString(),
    input,
    brand: {
      name: voice.brandName,
      url: site.homepage,
      domain: site.host.replace(/^www\./, ""),
      tagline: voice.tagline,
      elevatorPitch: voice.elevatorPitch,
      boilerplate: voice.boilerplate,
      description: styles?.meta.description ?? fetchedHome?.description ?? null,
    },
    logo: {
      primary: logo
        ? {
            format: logo.kind === "svg" ? "svg" : "image",
            svg: logo.svg,
            url: logo.src,
            png: rendered?.logoPng ?? null,
            width: logo.width,
            height: logo.height,
            label: logo.label,
          }
        : null,
      icons: (styles?.meta.icons ?? []).map((icon) => ({ rel: icon.rel, href: icon.href, sizes: icon.sizes })),
      socialImage: styles?.meta.ogImage ?? null,
      notes: logoNotes(rendered),
    },
    colors: { ...colors, themeColor: styles?.meta.themeColor ?? null },
    typography,
    components: {
      buttons: dedupeButtons(styles?.ctas ?? []).map((cta) => ({
        text: cta.text,
        background: cta.background,
        color: cta.color,
        radius: cta.radius,
        padding: cta.padding,
        weight: parseInt(cta.weight, 10) || 400,
      })),
    },
    voice: { ...voice.voice, metrics },
    messaging: { audiences: voice.audiences, ...voice.messaging, ctas: ctasSeen.length ? ctasSeen : voice.messaging.ctas },
    sources: {
      pages: corpus.map((page) => ({ url: page.url, kind: page.kind as PageKind | "home", title: page.title, chars: page.text.length, via: page.via })),
      screenshot: rendered?.screenshot ?? null,
    },
    provenance: {
      tinyfish: tinyfish.calls,
      model: voice.model,
      durationMs: Date.now() - startedAt,
      verification: voice.verification,
      warnings,
    },
  };

  log("guide.done", {
    host: site.host,
    ms: guide.provenance.durationMs,
    tinyfishCalls: tinyfish.calls.length,
    endpoints: [...new Set(tinyfish.calls.map((call) => call.endpoint))].join(","),
    pages: corpus.length,
    colors: colors.palette.length,
    fonts: typography.families.length,
    logo: guide.logo.primary?.format ?? "none",
    warnings: warnings.length,
  });
  onProgress({ stage: "done", message: `Brand guide ready in ${Math.round(guide.provenance.durationMs / 1000)}s` });
  return guide;
}

function isBrandPage(url: string): boolean {
  try {
    const { pathname, host } = new URL(url);
    if (/^(brand|design|press)\./i.test(host)) return true;
    return BRAND_PAGE_PATH.test(pathname) && !ARTICLE_PATH.test(pathname) && pathname.split("/").filter(Boolean).length <= 3;
  } catch {
    return false;
  }
}

function logoNotes(rendered: RenderedSite | null): string[] {
  const logo = rendered?.styles.logo;
  if (!logo) return ["No header logo was confidently identified; use the icons below."];
  const notes = [`Taken from the rendered site header (${logo.width}x${logo.height}px on a 1440px-wide viewport).`];
  if (logo.kind === "svg") notes.push("Vector SVG with computed fills inlined, so it renders the same outside the site.");
  return notes;
}

function dedupeButtons<T extends { text: string; background: string }>(buttons: T[]): T[] {
  const seen = new Set<string>();
  return buttons.filter((button) => {
    const key = button.background;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 4);
}
