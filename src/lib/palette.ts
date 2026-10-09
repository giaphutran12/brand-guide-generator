// Turns raw computed colours into a named, role-assigned palette.
// Weighting follows what a visitor sees: big backgrounds and lots of text dominate,
// while CTA buttons, brand CSS variables and official brand pages decide the primary.

import {
  blend, chroma, contrastRatio, describeColor, distance, parseColor, rgbToOklab, toCmyk, toHex, toHsl, wcagLevel, type Rgba,
} from "./color";
import { log } from "./log";
import type { RawPageStyles } from "./page-script";
import type { BrandColor, ColorPairing, ColorRole } from "./types";

const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };
const SAME_COLOR = 0.035; // OKLab distance under which two colours read as one
const CHROMATIC = 0.045;

interface Cluster {
  color: Rgba;
  score: number;
  bg: number;
  text: number;
  graphic: number;
  evidence: Set<string>;
}

export interface OfficialColor {
  name: string;
  hex: string;
  sourceUrl: string;
}

export function buildPalette(styles: RawPageStyles, official: OfficialColor[]) {
  const pageBackground = opaque(parseColor(styles.pageBackground) ?? WHITE, WHITE);
  const clusters: Cluster[] = [];

  const addColor = (raw: string, weight: number, kind: "bg" | "text" | "graphic" | "border" | "tag", evidence?: string) => {
    const parsed = parseColor(raw);
    if (!parsed || parsed.a < 0.2) return;
    const color = opaque(parsed, pageBackground);
    let cluster = clusters.find((existing) => distance(existing.color, color) < SAME_COLOR);
    if (!cluster) {
      cluster = { color, score: 0, bg: 0, text: 0, graphic: 0, evidence: new Set() };
      clusters.push(cluster);
    }
    if (kind === "bg") cluster.bg += weight;
    if (kind === "text") cluster.text += weight;
    if (kind === "graphic") cluster.graphic += weight;
    cluster.score += weight * { bg: 1, text: 0.8, graphic: 0.6, border: 0.15, tag: 0 }[kind];
    if (evidence) cluster.evidence.add(evidence);
  };

  // Normalise each channel to shares so a huge hero background cannot drown out text entirely.
  const channels: [Record<string, number>, "bg" | "text" | "graphic" | "border"][] = [
    [styles.backgrounds, "bg"], [styles.textColors, "text"], [styles.graphicColors, "graphic"], [styles.borderColors, "border"],
  ];
  for (const [map, kind] of channels) {
    const total = Object.values(map).reduce((sum, value) => sum + value, 0) || 1;
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    for (const [raw, weight] of sorted) addColor(raw, weight / total, kind);
  }

  addColor(styles.pageBackground, 0, "tag", "page background");
  styles.ctas.forEach((cta, index) => addColor(cta.background, 0, "tag", `button background ("${cta.text}")${index === 0 ? ", largest CTA" : ""}`));
  if (styles.meta.themeColor) addColor(styles.meta.themeColor, 0, "tag", "theme-color meta tag");
  // Framework defaults (Bootstrap, Tailwind internals) say nothing about the brand.
  const brandVariables = styles.cssColorVariables.filter(
    (variable) => /(^--|[-_])(brand|primary|accent|main|key|highlight)([-_]|$)/i.test(variable.name) && !/^--(bs|tw|chakra|mantine|mdc|mat)-/i.test(variable.name),
  );
  for (const fill of logoColors(styles.logo?.svg ?? null)) addColor(fill, 0, "tag", "logo colour");
  for (const variable of brandVariables.slice(0, 150)) addColor(variable.value, 0, "tag", `${variable.name} CSS variable`);
  for (const color of official) addColor(color.hex, 0, "tag", `official brand colour "${color.name}" (${color.sourceUrl})`);

  const total = clusters.reduce((sum, cluster) => sum + cluster.score, 0) || 1;
  const ranked = clusters.filter((cluster) => cluster.score / total > 0.002 || cluster.evidence.size > 0).sort((a, b) => b.score - a.score);
  const isChromatic = (cluster: Cluster) => chroma(cluster.color) > CHROMATIC;
  // A primary must read as a colour, not as tinted black or white (Stripe's #061B31 navy text is "chromatic" but not a brand colour).
  const isVivid = (cluster: Cluster) => {
    const lightness = rgbToOklab(cluster.color).l;
    return chroma(cluster.color) > 0.07 && lightness > 0.3 && lightness < 0.93;
  };
  const same = (cluster: Cluster, color: Rgba) => distance(cluster.color, color) < SAME_COLOR;

  const background = ranked.find((cluster) => same(cluster, pageBackground))!;
  // Primary text is the highest-contrast colour that carries a real share of the copy;
  // the most frequent grey is usually secondary text (Linear: #8A8F98 is 45% of text, #F7F8F8 is the headline colour).
  const textCandidates = ranked.filter((cluster) => cluster !== background && cluster.text >= 0.08);
  const text =
    [...textCandidates].sort((a, b) => contrastRatio(b.color, background.color) - contrastRatio(a.color, background.color))[0] ??
    [...ranked].filter((cluster) => cluster !== background).sort((a, b) => b.text - a.text)[0] ??
    background;
  const mutedText = [...ranked]
    .filter((cluster) => cluster !== background && cluster !== text && !isChromatic(cluster) && cluster.text > 0.05)
    .filter((cluster) => contrastRatio(cluster.color, background.color) < contrastRatio(text.color, background.color))
    .sort((a, b) => b.text - a.text)[0];

  const officialClusters = ranked.filter((cluster) => [...cluster.evidence].some((e) => e.startsWith("official")));
  const ctaClusters = ranked.filter((cluster) => [...cluster.evidence].some((e) => e.startsWith("button background")));
  const varClusters = ranked.filter((cluster) => [...cluster.evidence].some((e) => e.endsWith("CSS variable")));
  const themeCluster = ranked.find((cluster) => cluster.evidence.has("theme-color meta tag"));
  const logoClusters = ranked.filter((cluster) => cluster.evidence.has("logo colour"));
  // Primary: an official colour that also shows up on the page, then a coloured CTA, then a
  // brand CSS variable or theme colour, then the most visible colour, then a mono CTA.
  const primary =
    officialClusters.filter(isVivid).find((cluster) => cluster.score > 0) ??
    logoClusters.filter(isVivid).find((cluster) => cluster.score / total > 0.002) ??
    ctaClusters.find(isVivid) ??
    varClusters.filter(isVivid).find((cluster) => cluster.score > 0) ??
    (themeCluster && isVivid(themeCluster) ? themeCluster : undefined) ??
    ranked.find((cluster) => isVivid(cluster) && cluster.score / total > 0.01) ??
    ctaClusters.find((cluster) => cluster !== background) ??
    text;
  const primaryReason = officialClusters.includes(primary)
    ? "official brand page"
    : logoClusters.includes(primary)
      ? "logo colour, also used across the page"
      : ctaClusters.includes(primary)
      ? "call-to-action buttons"
      : varClusters.includes(primary)
        ? "brand CSS variable"
        : primary === themeCluster
          ? "theme-color meta"
          : primary === text
            ? "monochrome site: text colour"
            : "most visible colour";

  const taken = new Set<Cluster>([background, text, primary, mutedText].filter(Boolean) as Cluster[]);
  const accents = ranked
    .filter((cluster) => !taken.has(cluster) && isChromatic(cluster) && distance(cluster.color, primary.color) > 0.08)
    .filter((cluster) => cluster.score / total > 0.004 || (cluster.score > 0 && cluster.evidence.size > 0) || cluster.evidence.has("logo colour"))
    .slice(0, 4);
  accents.forEach((cluster) => taken.add(cluster));
  const neutrals = ranked
    .filter((cluster) => !taken.has(cluster) && !isChromatic(cluster) && cluster.score / total > 0.01)
    .slice(0, 4)
    .sort((a, b) => rgbToOklab(b.color).l - rgbToOklab(a.color).l);
  neutrals.forEach((cluster) => taken.add(cluster));
  const unmatchedOfficial = officialClusters.filter((cluster) => !taken.has(cluster));

  const palette: BrandColor[] = [
    swatch(primary, "primary", total, [`chosen from ${primaryReason}`]),
    ...accents.map((cluster) => swatch(cluster, "accent", total)),
    swatch(background, "background", total),
    ...(text !== primary ? [swatch(text, "text", total)] : []),
    ...(mutedText ? [swatch(mutedText, "muted-text", total)] : []),
    ...neutrals.map((cluster) => swatch(cluster, cluster.bg > cluster.text ? "surface" : "neutral", total)),
    ...unmatchedOfficial.map((cluster) => swatch(cluster, "official", total, ["listed on the brand page but not seen on the homepage"])),
  ];

  const pairings: ColorPairing[] = [
    pair(text.color, background.color, "Body text on page background"),
    pair(onColor(primary.color), primary.color, "Text on primary"),
    ...(mutedText ? [pair(mutedText.color, background.color, "Muted text on page background")] : []),
    ...(primary !== text ? [pair(primary.color, background.color, "Primary on page background")] : []),
    ...accents.slice(0, 2).map((cluster) => pair(onColor(cluster.color), cluster.color, `Text on ${describeColor(cluster.color).toLowerCase()} accent`)),
  ];

  const cssVariables = styles.cssColorVariables
    .map((variable) => ({ name: variable.name, value: variable.value, color: parseColor(variable.value) }))
    .filter((variable) => variable.color && variable.color.a > 0.2)
    .sort((a, b) => Number(/brand|primary|accent/i.test(b.name)) - Number(/brand|primary|accent/i.test(a.name)))
    .slice(0, 40)
    .map((variable) => ({ name: variable.name, value: variable.value, hex: toHex(opaque(variable.color!, pageBackground)) }));

  log("palette.built", {
    clusters: clusters.length,
    colors: palette.length,
    primary: toHex(primary.color),
    primaryReason: primaryReason.replace(/\s+/g, "_"),
    accents: accents.length,
    official: official.length,
    officialUnmatched: unmatchedOfficial.length,
  });
  return { palette, pairings, cssVariables };
}

function swatch(cluster: Cluster, role: ColorRole, total: number, extraEvidence: string[] = []): BrandColor {
  const { color } = cluster;
  const hsl = toHsl(color);
  const cmyk = toCmyk(color);
  const usage: string[] = [];
  if (cluster.bg > 0.02) usage.push(`${Math.round(cluster.bg * 100)}% of background area`);
  if (cluster.text > 0.02) usage.push(`${Math.round(cluster.text * 100)}% of text`);
  if (cluster.graphic > 0.02) usage.push(`${Math.round(cluster.graphic * 100)}% of icons and graphics`);
  return {
    name: describeColor(color),
    role,
    hex: toHex(color),
    rgb: `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    cmyk: `cmyk(${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k})`,
    share: Math.round((cluster.score / total) * 1000) / 10,
    evidence: [...extraEvidence, ...usage, ...[...cluster.evidence].slice(0, 6)],
    bestTextColor: onColor(color) === WHITE ? "#FFFFFF" : "#000000",
    contrastOnWhite: contrastRatio(color, WHITE),
    contrastOnBlack: contrastRatio(color, BLACK),
  };
}

function onColor(color: Rgba): Rgba {
  return contrastRatio(color, WHITE) >= contrastRatio(color, BLACK) ? WHITE : BLACK;
}

function pair(foreground: Rgba, background: Rgba, label: string): ColorPairing {
  const ratio = contrastRatio(foreground, background);
  return { foreground: toHex(foreground), background: toHex(background), label, ratio, wcag: wcagLevel(ratio) };
}

function opaque(color: Rgba, under: Rgba): Rgba {
  return color.a >= 0.999 ? { ...color, a: 1 } : blend(color, under);
}

/** Distinct fill and stroke colours declared in the logo SVG (computed values were inlined by the page script). */
function logoColors(svg: string | null): string[] {
  if (!svg) return [];
  const values = [...svg.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((match) => match[1]).filter((value) => !/^(none|currentcolor|transparent)$|url\(/i.test(value));
  return [...new Set(values)].slice(0, 8);
}
