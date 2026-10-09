// Renders the live homepage in a TinyFish remote browser (over CDP) and measures it.
// Colours, fonts and the logo only exist after CSS and JS run, so this is the step
// that makes the palette and typography accurate rather than guessed.

import { chromium } from "playwright-core";
import { log } from "./log";
import { PAGE_SCRIPT, type RawPageStyles } from "./page-script";
import type { TinyFishLedger } from "./tinyfish";

export interface RenderedSite {
  styles: RawPageStyles;
  screenshot: string | null; // data URI (JPEG) of the first viewport
  logoPng: string | null; // data URI of the logo element as rendered
}

const CONSENT_BUTTON = /^(accept|accept all|accept all cookies|allow all|agree|i agree|got it|ok|okay|allow cookies|continue)$/i;

const ATTEMPTS = 2;

export async function renderSite(homepage: string, tinyfish: TinyFishLedger): Promise<RenderedSite> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await renderOnce(homepage, tinyfish, attempt);
    } catch (error) {
      const reason = (error as Error).message.split("\n")[0].slice(0, 160);
      log("render.attempt_failed", { attempt, reason });
      if (attempt >= ATTEMPTS) throw error;
    }
  }
}

async function renderOnce(homepage: string, tinyfish: TinyFishLedger, attempt: number): Promise<RenderedSite> {
  const purpose = "Render the live homepage to measure colours, type and logo";
  const session = await tinyfish.openBrowser(attempt > 1 ? `${purpose} (retry)` : purpose, homepage);
  const browser = await chromium.connectOverCDP(session.cdpUrl, { timeout: 30_000 });
  const startedAt = Date.now();

  try {
    const context = browser.contexts()[0] ?? (await browser.newContext());
    const page = context.pages()[0] ?? (await context.newPage());
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, homepage);
    await waitForRealContent(page);
    await page.evaluate("document.fonts && document.fonts.ready").catch(() => undefined);

    const loadedMs = Date.now() - startedAt;
    const dismissed = await dismissConsent(page);
    // Scroll through the first screens so lazy sections render, then come back up.
    // behavior "instant" overrides CSS smooth scrolling, which would otherwise leave the page
    // mid-scroll at measurement time and push fixed headers (and their logos) "down the page".
    for (const y of [900, 1800, 2700, 0]) {
      await page.evaluate(`window.scrollTo({ top: ${y}, behavior: "instant" })`);
      await page.waitForTimeout(350);
    }

    const styles = (await page.evaluate(PAGE_SCRIPT)) as RawPageStyles;
    const screenshot = await page
      .screenshot({ type: "jpeg", quality: 70 })
      .then((buffer) => `data:image/jpeg;base64,${buffer.toString("base64")}`)
      .catch((error: Error) => {
        log("render.screenshot_failed", { reason: error.message.slice(0, 120) });
        return null;
      });
    const logoPng = styles.logo ? await screenshotLogo(page, styles.logo) : null;

    const summary = `rendered ${styles.elementCount} elements in ${Date.now() - startedAt}ms, ${Object.keys(styles.backgrounds).length} bg colours, ${styles.fontFiles.length} font files, logo ${styles.logo ? styles.logo.kind : "not found"}${dismissed ? ", consent dismissed" : ""}`;
    tinyfish.completeLastBrowserCall(summary, Date.now() - startedAt);
    log("render.done", {
      loadedMs,
      totalMs: Date.now() - startedAt,
      elements: styles.elementCount,
      ctas: styles.ctas.length,
      cssColorVars: styles.cssColorVariables.length,
      fontFiles: styles.fontFiles.length,
      logo: styles.logo?.kind ?? "none",
      screenshotBytes: screenshot?.length ?? 0,
    });
    return { styles, screenshot, logoPng };
  } finally {
    await browser.close().catch(() => undefined);
  }
}

// Wait for the first response, then poll readyState in the page: lifecycle events over a
// remote CDP connection can be missed, and slow third-party scripts should not sink the render.
async function openPage(page: import("playwright-core").Page, url: string): Promise<void> {
  const startedAt = Date.now();
  await page.goto(url, { waitUntil: "commit", timeout: 30_000 });
  const committedMs = Date.now() - startedAt;
  const deadline = Date.now() + 30_000;
  let state = "loading";
  while (Date.now() < deadline) {
    state = (await page.evaluate("document.readyState").catch(() => "loading")) as string;
    if (state === "complete") break;
    if (state === "interactive" && Date.now() > deadline - 20_000) break; // DOM is usable; give scripts ~10s more at most
    await page.waitForTimeout(500);
  }
  const hasContent = (await page.evaluate("document.body ? document.body.innerText.length : 0").catch(() => 0)) as number;
  if (state === "loading" && hasContent < 50) throw new Error(`page never became ready (readyState ${state})`);
  log("render.page_open", { committedMs, readyMs: Date.now() - startedAt, readyState: state, textChars: hasContent });
}

// Bot checkpoints and splash screens render a near-empty page first. Give them a moment to
// hand over to the real site; if they never do, throw so the caller retries with a fresh session.
async function waitForRealContent(page: import("playwright-core").Page): Promise<void> {
  const deadline = Date.now() + 12_000;
  let size = { text: 0, elements: 0 };
  while (Date.now() < deadline) {
    size = (await page
      .evaluate("({ text: document.body ? document.body.innerText.length : 0, elements: document.querySelectorAll('body *').length })")
      .catch(() => ({ text: 0, elements: 0 }))) as { text: number; elements: number };
    if (size.text >= 300 && size.elements >= 100) return;
    await page.waitForTimeout(1_000);
  }
  log("render.thin_page", { textChars: size.text, elements: size.elements, reason: "likely a bot checkpoint or splash screen" });
  throw new Error(`rendered page stayed nearly empty (${size.text} chars, ${size.elements} elements)`);
}

/**
 * Reads pages that Fetch could not (bot walls, client-rendered apps) by visiting them in one
 * TinyFish browser session and taking the rendered main text.
 */
export async function readPagesInBrowser(urls: string[], tinyfish: TinyFishLedger): Promise<{ url: string; title: string; text: string }[]> {
  if (urls.length === 0) return [];
  const session = await tinyfish.openBrowser("Read pages Fetch could not extract (client-rendered or bot-protected)", urls.join(", "));
  const browser = await chromium.connectOverCDP(session.cdpUrl, { timeout: 30_000 });
  const startedAt = Date.now();
  const pages: { url: string; title: string; text: string }[] = [];
  try {
    const context = browser.contexts()[0] ?? (await browser.newContext());
    const page = context.pages()[0] ?? (await context.newPage());
    for (const url of urls) {
      try {
        await openPage(page, url);
        await page.waitForTimeout(600);
        const result = (await page.evaluate(
          `({ title: document.title, text: (document.querySelector("main") || document.body).innerText.replace(/\\n{3,}/g, "\\n\\n").slice(0, 12000) })`,
        )) as { title: string; text: string };
        if (result.text.length > 100) pages.push({ url, ...result });
        log("render.page_read", { chars: result.text.length });
      } catch (error) {
        log("render.page_read_failed", { reason: (error as Error).message.split("\n")[0].slice(0, 120) });
      }
    }
  } finally {
    await browser.close().catch(() => undefined);
  }
  tinyfish.completeLastBrowserCall(`${pages.length}/${urls.length} pages read`, Date.now() - startedAt);
  return pages;
}

// Clip the logo from a viewport screenshot using the position the page script measured.
// Locator-based element screenshots fail on sites that re-render their header after load.
async function screenshotLogo(page: import("playwright-core").Page, logo: import("./page-script").RawLogo): Promise<string | null> {
  try {
    await page.evaluate(`window.scrollTo({ top: 0, behavior: "instant" })`);
    const pad = 4;
    const buffer = await page.screenshot({
      type: "png",
      omitBackground: true,
      clip: { x: Math.max(logo.x - pad, 0), y: Math.max(logo.y - pad, 0), width: logo.width + pad * 2, height: logo.height + pad * 2 },
      timeout: 8_000,
    });
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch (error) {
    log("render.logo_screenshot_failed", { reason: (error as Error).message.split("\n")[0].slice(0, 120) });
    return null;
  }
}

async function dismissConsent(page: import("playwright-core").Page): Promise<boolean> {
  // One in-page pass: per-button CDP round trips cost tens of seconds on a remote browser.
  try {
    const label = (await page.evaluate(`(() => {
      const pattern = ${CONSENT_BUTTON.toString()};
      const buttons = Array.from(document.querySelectorAll("button, a[role='button'], [role='button']"));
      for (const button of buttons) {
        const text = (button.innerText || "").trim();
        const rect = button.getBoundingClientRect();
        if (pattern.test(text) && rect.width > 0 && rect.height > 0) { button.click(); return text.toLowerCase(); }
      }
      return null;
    })()`)) as string | null;
    if (!label) return false;
    await page.waitForTimeout(400);
    log("render.consent_dismissed", { label });
    return true;
  } catch (error) {
    log("render.consent_check_failed", { reason: (error as Error).message.slice(0, 120) });
    return false;
  }
}
