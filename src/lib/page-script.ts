// Runs inside the TinyFish remote browser via page.evaluate(). Kept as a plain JS
// string so bundlers cannot inject helpers that do not exist in the page.
// It measures what a visitor actually sees: computed colours weighted by on-screen
// area and text size, the type styles of each role, CTA styling, CSS custom
// properties, the header logo, and every font file the page loaded.

export interface RawStyle {
  family: string;
  weight: string;
  size: string;
  lineHeight: string;
  letterSpacing: string;
  transform: string;
  color: string;
  sample: string;
}

export interface RawCta {
  text: string;
  background: string;
  color: string;
  radius: string;
  padding: string;
  weight: string;
  area: number;
  family: string;
  size: string;
  lineHeight: string;
  letterSpacing: string;
  transform: string;
}

export interface RawLogo {
  kind: "svg" | "img";
  src: string | null;
  svg: string | null;
  label: string;
  width: number;
  height: number;
  /** Viewport position when measured (page scrolled to top), used to clip a PNG of the logo. */
  x: number;
  y: number;
  score: number;
}

export interface RawPageStyles {
  url: string;
  title: string;
  pageBackground: string;
  backgrounds: Record<string, number>;
  textColors: Record<string, number>;
  graphicColors: Record<string, number>;
  borderColors: Record<string, number>;
  roles: Record<string, RawStyle | null>;
  fontUsage: Record<string, number>;
  weightUsage: Record<string, number>;
  ctas: RawCta[];
  cssColorVariables: { name: string; value: string }[];
  cssFontVariables: { name: string; value: string }[];
  meta: {
    themeColor: string | null;
    siteName: string | null;
    ogImage: string | null;
    description: string | null;
    icons: { rel: string; href: string; sizes: string | null; color: string | null }[];
  };
  fontFiles: string[];
  fontStylesheets: string[];
  fontFaces: { family: string; weight: string; style: string; src: string }[];
  logo: RawLogo | null;
  elementCount: number;
  /** Rendered copy and links, used only when Fetch cannot read a client-rendered homepage. */
  visibleText: string;
  links: string[];
}

export const PAGE_SCRIPT = String.raw`(() => {
  const viewportWidth = innerWidth;
  const viewportHeight = innerHeight;
  const scanDepth = viewportHeight * 3;
  const transparent = (c) => !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c);
  const add = (map, key, weight) => { if (transparent(key) || !(weight > 0)) return; map[key] = (map[key] || 0) + weight; };
  const isVisible = (el, style, rect) =>
    rect.width >= 2 && rect.height >= 2 && style.visibility !== "hidden" && style.display !== "none" && parseFloat(style.opacity) > 0.05;
  const ownText = (el) => { let t = ""; for (const n of el.childNodes) if (n.nodeType === 3) t += n.textContent; return t.replace(/\s+/g, " ").trim(); };

  const backgrounds = {}, textColors = {}, graphicColors = {}, borderColors = {}, fontUsage = {}, weightUsage = {};
  const ctas = [];
  const elements = Array.from(document.querySelectorAll("body *")).slice(0, 6000);

  const pageBackground = (() => {
    for (const el of [document.body, document.documentElement]) {
      const c = getComputedStyle(el).backgroundColor;
      if (!transparent(c)) return c;
    }
    return "rgb(255, 255, 255)";
  })();

  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    const top = rect.top + scrollY;
    if (top > scanDepth) continue;
    const style = getComputedStyle(el);
    if (!isVisible(el, style, rect)) continue;
    const area = Math.min(rect.width, viewportWidth) * Math.min(rect.height, viewportHeight);

    add(backgrounds, style.backgroundColor, area);
    if (style.backgroundImage && style.backgroundImage.includes("gradient")) {
      const stops = style.backgroundImage.match(/(rgba?|oklch|oklab|lab|lch|color)\([^)]*\)/g) || [];
      for (const stop of stops) add(backgrounds, stop, area / Math.max(stops.length, 1));
    }
    for (const side of ["Top", "Bottom", "Left", "Right"]) {
      const width = parseFloat(style["border" + side + "Width"]);
      if (width >= 1 && style["border" + side + "Style"] !== "none") add(borderColors, style["border" + side + "Color"], width * (side === "Top" || side === "Bottom" ? rect.width : rect.height));
    }
    if (el instanceof SVGElement && el.tagName.toLowerCase() !== "svg") {
      add(graphicColors, style.fill, Math.max(area, 64));
      if (style.stroke && style.stroke !== "none") add(graphicColors, style.stroke, Math.max(area / 4, 16));
    }

    const text = ownText(el);
    if (text.length > 0) {
      const weight = text.length * parseFloat(style.fontSize);
      add(textColors, style.color, weight);
      fontUsage[style.fontFamily] = (fontUsage[style.fontFamily] || 0) + text.length;
      weightUsage[style.fontWeight] = (weightUsage[style.fontWeight] || 0) + text.length;
    }

    const tag = el.tagName.toLowerCase();
    const label = (el.innerText || "").replace(/\s+/g, " ").trim();
    if ((tag === "a" || tag === "button" || el.getAttribute("role") === "button") && label && label.length <= 40 && top < viewportHeight * 2 && !/^(skip|accept|reject|allow|cookie|close|dismiss|chat|help|support|menu)\b/i.test(label) && rect.left >= 0 && rect.top + scrollY >= 0) {
      // Some buttons paint their fill on ::before/::after (Duolingo's raised buttons).
      const bg = [style.backgroundColor, getComputedStyle(el, "::before").backgroundColor, getComputedStyle(el, "::after").backgroundColor].find((c) => !transparent(c)) || style.backgroundColor;
      const padded = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) >= 16;
      if (!transparent(bg) && bg !== pageBackground && padded && rect.height >= 28 && rect.height <= 90) {
        ctas.push({ text: label, background: bg, color: style.color, radius: style.borderRadius, padding: style.padding, weight: style.fontWeight, area: rect.width * rect.height, family: style.fontFamily, size: style.fontSize, lineHeight: style.lineHeight, letterSpacing: style.letterSpacing, transform: style.textTransform });
      }
    }
  }

  // Animated headlines often render their text twice (visible split letters + screen-reader copy).
  const dedupeSample = (text) => {
    const doubled = text.match(/^(.{1,40}?)\s+\1$/);
    if (doubled) return doubled[1];
    const head = text.slice(0, 24);
    const again = head.length >= 12 ? text.indexOf(head, 1) : -1;
    return again > 0 ? text.slice(0, again).trim() : text;
  };
  const describe = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    return { family: s.fontFamily, weight: s.fontWeight, size: s.fontSize, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, transform: s.textTransform, color: s.color, sample: dedupeSample((el.innerText || "").replace(/\s+/g, " ").trim()).slice(0, 90) };
  };
  const firstVisible = (selector) => Array.from(document.querySelectorAll(selector)).find((el) => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return isVisible(el, s, r) && (el.innerText || "").trim().length > 1;
  });
  // Body copy is the paragraph style that covers the most text across the page,
  // not the first <p> and not one long footnote.
  const bodyParagraph = (() => {
    const tally = {};
    for (const p of Array.from(document.querySelectorAll("p")).slice(0, 600)) {
      const r = p.getBoundingClientRect(); const s = getComputedStyle(p);
      const text = (p.innerText || "").trim();
      if (!isVisible(p, s, r) || text.length < 20 || parseFloat(s.fontSize) > 20) continue;
      const key = s.fontFamily + "|" + s.fontSize + "|" + s.fontWeight;
      const entry = tally[key] || (tally[key] = { chars: 0, example: null, exampleLength: 0 });
      // Marketing body copy is 14px and up; smaller paragraphs are usually product mockups or legal notes.
      entry.chars += text.length * (parseFloat(s.fontSize) >= 14 ? 1 : 0.3);
      if (!/^[0-9*†]/.test(text) && text.length > entry.exampleLength) { entry.example = p; entry.exampleLength = text.length; }
    }
    const best = Object.values(tally).sort((a, b) => b.chars - a.chars)[0];
    return best ? best.example : null;
  })();
  const roles = {
    display: describe(firstVisible("h1")),
    heading: describe(firstVisible("h2")),
    subheading: describe(firstVisible("h3")),
    body: describe(bodyParagraph),
    navigation: describe(firstVisible("header nav a, nav a, header a")),
    button: describe(firstVisible("button, a[class*='button' i], a[class*='btn' i]")),
    code: describe(firstVisible("code, pre, kbd")),
  };

  const rootStyle = getComputedStyle(document.documentElement);
  const cssColorVariables = [], cssFontVariables = [];
  for (let i = 0; i < rootStyle.length && cssColorVariables.length < 400; i++) {
    const name = rootStyle[i];
    if (!name.startsWith("--")) continue;
    const value = rootStyle.getPropertyValue(name).trim();
    if (/^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\(|oklab\(|lab\(|lch\(|color\()/i.test(value)) cssColorVariables.push({ name, value });
    else if (/font|family|typeface/i.test(name) && /[a-z]/i.test(value) && value.length < 200) cssFontVariables.push({ name, value });
  }

  const metaContent = (selector) => document.querySelector(selector)?.getAttribute("content") || null;
  const icons = Array.from(document.querySelectorAll("link[rel~='icon'], link[rel='apple-touch-icon'], link[rel='mask-icon']")).map((l) => ({ rel: l.getAttribute("rel"), href: l.href, sizes: l.getAttribute("sizes"), color: l.getAttribute("color") }));

  const fontFiles = performance.getEntriesByType("resource").map((e) => e.name).filter((n) => /\.(woff2?|ttf|otf)(\?|#|$)/i.test(n));
  const fontStylesheets = Array.from(document.querySelectorAll("link[rel='stylesheet'], link[rel='preload'][as='style']")).map((l) => l.href).filter((h) => /fonts\.googleapis|typekit|use\.typekit|fonts\.com|cloud\.typography|fontshare/i.test(h));
  const fontFaces = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { continue; }
    for (const rule of Array.from(rules || [])) {
      if (rule.constructor && rule.constructor.name === "CSSFontFaceRule" && fontFaces.length < 80) {
        fontFaces.push({ family: rule.style.getPropertyValue("font-family").replace(/["']/g, "").trim(), weight: rule.style.getPropertyValue("font-weight"), style: rule.style.getPropertyValue("font-style"), src: rule.style.getPropertyValue("src").slice(0, 300) });
      }
    }
  }

  const logo = (() => {
    const hasLogoWord = (el) => {
      for (let node = el, depth = 0; node && depth < 3; node = node.parentElement, depth++) {
        const words = [node.id, typeof node.className === "string" ? node.className : (node.className && node.className.baseVal) || "", node.getAttribute && node.getAttribute("aria-label"), node.getAttribute && node.getAttribute("alt"), node.getAttribute && node.getAttribute("title"), node.getAttribute && node.getAttribute("data-testid")].join(" ");
        if (/logo|wordmark|brand(?!ing)/i.test(words)) return true;
      }
      return false;
    };
    const homeHref = (a) => { if (!a) return false; try { const u = new URL(a.href); return u.host === location.host && (u.pathname === "/" || /^\/[a-z]{2}(-[a-z]{2})?\/?$/i.test(u.pathname)); } catch (e) { return false; } };
    const graphics = Array.from(document.querySelectorAll("svg, img")).filter((el) => !el.closest("svg svg") && !(el.tagName.toLowerCase() === "svg" && el.parentElement && el.parentElement.closest("svg")));
    let best = null;
    for (const el of graphics.slice(0, 600)) {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (!isVisible(el, style, rect) || rect.top + scrollY > 260 || rect.width < 16 || rect.width > 420 || rect.height > 160) continue;
      let score = 0;
      if (el.closest("header, nav, [role='banner']")) score += 5;
      if (hasLogoWord(el)) score += 5;
      if (homeHref(el.closest("a"))) score += 4;
      if (rect.left < viewportWidth / 3) score += 2;
      if (rect.width > rect.height * 1.6) score += 1;
      if (rect.width < 26 && rect.height < 26) score -= 3;
      if (!best || score > best.score) best = { el, score, rect };
    }
    if (!best || best.score < 5) return null;
    const el = best.el;
    el.setAttribute("data-brand-guide-logo", "1");
    const label = el.getAttribute("aria-label") || el.getAttribute("alt") || el.closest("a")?.getAttribute("aria-label") || el.querySelector?.("title")?.textContent || "";
    if (el.tagName.toLowerCase() === "img") {
      return { kind: "img", src: el.currentSrc || el.src, svg: null, label, width: Math.round(best.rect.width), height: Math.round(best.rect.height), x: best.rect.left, y: best.rect.top + scrollY, score: best.score };
    }
    // Inline SVG: resolve currentColor and CSS-driven fills so the markup renders the same standalone.
    const clone = el.cloneNode(true);
    const originals = [el, ...el.querySelectorAll("*")];
    const copies = [clone, ...clone.querySelectorAll("*")];
    originals.forEach((original, i) => {
      const s = getComputedStyle(original);
      const copy = copies[i];
      if (!copy || !copy.setAttribute) return;
      if (s.fill && s.fill !== "none" && !/url\(/.test(s.fill)) copy.setAttribute("fill", s.fill);
      if (s.stroke && s.stroke !== "none" && !/url\(/.test(s.stroke)) copy.setAttribute("stroke", s.stroke);
    });
    clone.removeAttribute("class");
    clone.removeAttribute("data-brand-guide-logo");
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", "0 0 " + Math.round(best.rect.width) + " " + Math.round(best.rect.height));
    clone.setAttribute("width", String(Math.round(best.rect.width)));
    clone.setAttribute("height", String(Math.round(best.rect.height)));
    return { kind: "svg", src: null, svg: clone.outerHTML.slice(0, 60000), label, width: Math.round(best.rect.width), height: Math.round(best.rect.height), x: best.rect.left, y: best.rect.top + scrollY, score: best.score };
  })();

  return {
    url: location.href,
    title: document.title,
    pageBackground,
    backgrounds, textColors, graphicColors, borderColors,
    roles, fontUsage, weightUsage,
    ctas: ctas.sort((a, b) => b.area - a.area).slice(0, 12),
    cssColorVariables, cssFontVariables,
    meta: {
      themeColor: metaContent("meta[name='theme-color']"),
      siteName: metaContent("meta[property='og:site_name']") || metaContent("meta[name='application-name']"),
      ogImage: metaContent("meta[property='og:image']"),
      description: metaContent("meta[name='description']") || metaContent("meta[property='og:description']"),
      icons,
    },
    fontFiles: Array.from(new Set(fontFiles)).slice(0, 40),
    fontStylesheets: Array.from(new Set(fontStylesheets)),
    fontFaces,
    logo,
    elementCount: elements.length,
    visibleText: (document.querySelector("main") || document.body).innerText.replace(/\n{3,}/g, "\n\n").slice(0, 15000),
    links: Array.from(new Set(Array.from(document.querySelectorAll("a[href]")).map((a) => a.href).filter((href) => /^https?:/.test(href)))).slice(0, 400),
  };
})()`;
