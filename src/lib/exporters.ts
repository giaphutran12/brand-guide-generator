// Formats other tools can consume directly:
//   tokens   -> W3C Design Tokens (DTCG) JSON: Tokens Studio for Figma, Style Dictionary
//   css      -> :root custom properties
//   tailwind -> Tailwind v4 @theme block
//   md       -> a Markdown brand guide for docs, Notion or speaker notes

import { parseColor, toHex } from "./color";
import type { BrandColor, BrandGuide } from "./types";

export type ExportFormat = "json" | "tokens" | "css" | "tailwind" | "md";

export const EXPORTS: Record<ExportFormat, { label: string; contentType: string; extension: string }> = {
  json: { label: "Brand guide JSON", contentType: "application/json", extension: "brand.json" },
  tokens: { label: "Design tokens (W3C / Figma Tokens Studio)", contentType: "application/json", extension: "tokens.json" },
  css: { label: "CSS variables", contentType: "text/css", extension: "brand.css" },
  tailwind: { label: "Tailwind v4 theme", contentType: "text/css", extension: "tailwind.css" },
  md: { label: "Markdown brand guide", contentType: "text/markdown", extension: "brand-guide.md" },
};

export function exportGuide(guide: BrandGuide, format: ExportFormat): string {
  switch (format) {
    case "json":
      return JSON.stringify(guide, null, 2);
    case "tokens":
      return JSON.stringify(toDesignTokens(guide), null, 2);
    case "css":
      return toCss(guide);
    case "tailwind":
      return toTailwind(guide);
    case "md":
      return toMarkdown(guide);
  }
}

/** Unique, readable token names: primary, accent-1, background, text, neutral-1 ... */
export function tokenNames(palette: BrandColor[]): { token: string; color: BrandColor }[] {
  const counts = new Map<string, number>();
  const totals = new Map<string, number>();
  for (const color of palette) totals.set(color.role, (totals.get(color.role) ?? 0) + 1);
  return palette.map((color) => {
    const index = (counts.get(color.role) ?? 0) + 1;
    counts.set(color.role, index);
    return { token: (totals.get(color.role) ?? 0) > 1 ? `${color.role}-${index}` : color.role, color };
  });
}

function fontToken(guide: BrandGuide, use: "heading" | "body" | "code") {
  const roles = use === "heading" ? ["display", "heading"] : use === "body" ? ["body"] : ["code"];
  return guide.typography.families.find((family) => family.usedFor.some((role) => roles.includes(role)));
}

function toDesignTokens(guide: BrandGuide) {
  const color: Record<string, unknown> = {};
  for (const { token, color: swatch } of tokenNames(guide.colors.palette)) {
    color[token] = { $type: "color", $value: swatch.hex, $description: `${swatch.name}. ${swatch.evidence.slice(0, 2).join("; ")}` };
  }
  const fontFamily: Record<string, unknown> = {};
  for (const use of ["heading", "body", "code"] as const) {
    const family = fontToken(guide, use);
    if (family) fontFamily[use] = { $type: "fontFamily", $value: family.stack.split(",").map((part) => part.replace(/["']/g, "").trim()) };
  }
  const typography: Record<string, unknown> = {};
  for (const style of guide.typography.scale) {
    typography[style.role] = {
      $type: "typography",
      $value: {
        fontFamily: style.family,
        fontSize: { value: style.sizePx, unit: "px" },
        fontWeight: style.weight,
        lineHeight: style.lineHeight ?? 1.2,
        letterSpacing: { value: style.letterSpacingEm, unit: "em" },
      },
    };
  }
  return {
    $description: `${guide.brand.name} brand tokens extracted from ${guide.brand.url} on ${guide.generatedAt.slice(0, 10)}`,
    color,
    fontFamily,
    typography,
  };
}

function cssColorVariables(guide: BrandGuide, prefix: string) {
  return tokenNames(guide.colors.palette).map(({ token, color }) => `  ${prefix}${token}: ${color.hex};`);
}

function toCss(guide: BrandGuide): string {
  const fonts = (["heading", "body", "code"] as const)
    .map((use) => [use, fontToken(guide, use)] as const)
    .filter(([, family]) => family)
    .map(([use, family]) => `  --font-${use}: ${family!.stack};`);
  const buttons = guide.components.buttons[0];
  const radius = buttons ? [`  --radius-button: ${buttons.radius};`] : [];
  return [`/* ${guide.brand.name} brand variables, extracted from ${guide.brand.url} */`, ":root {", ...cssColorVariables(guide, "--color-"), ...fonts, ...radius, "}", ""].join("\n");
}

function toTailwind(guide: BrandGuide): string {
  const fonts = (["heading", "body", "code"] as const)
    .map((use) => [use === "code" ? "mono" : use, fontToken(guide, use)] as const)
    .filter(([, family]) => family)
    .map(([use, family]) => `  --font-${use}: ${family!.stack};`);
  return [`/* ${guide.brand.name} theme for Tailwind CSS v4. Paste after @import "tailwindcss"; */`, "@theme {", ...cssColorVariables(guide, "--color-"), ...fonts, "}", ""].join("\n");
}

function toMarkdown(guide: BrandGuide): string {
  const { brand, voice, messaging } = guide;
  const lines: string[] = [];
  const push = (...items: string[]) => lines.push(...items);
  const quote = (q: { quote: string; sourceUrl: string }) => `> "${q.quote}" ([source](${q.sourceUrl}))`;

  push(`# ${brand.name} brand guide`, "", `Extracted from ${brand.url} on ${guide.generatedAt.slice(0, 10)}.`, "");
  if (brand.tagline) push(`**Tagline:** ${brand.tagline}`, "");
  push(`**Elevator pitch:** ${brand.elevatorPitch}`, "", `**Boilerplate:** ${brand.boilerplate}`, "");

  push("## Logo", "");
  if (guide.logo.primary?.url) push(`- Primary logo: ${guide.logo.primary.url}`);
  if (guide.logo.primary?.svg) push("- Primary logo: inline SVG (see brand.json `logo.primary.svg`)");
  for (const icon of guide.logo.icons.slice(0, 4)) push(`- ${icon.rel}${icon.sizes ? ` (${icon.sizes})` : ""}: ${icon.href}`);
  for (const note of guide.logo.notes) push(`- ${note}`);
  push("");

  push("## Colour", "", "| Role | Name | HEX | RGB | CMYK | Share | Text on it |", "|---|---|---|---|---|---|---|");
  for (const color of guide.colors.palette) {
    push(`| ${color.role} | ${color.name} | \`${color.hex}\` | ${color.rgb} | ${color.cmyk} | ${color.share}% | ${color.bestTextColor} |`);
  }
  push("", "**Contrast checks**", "");
  for (const pairing of guide.colors.pairings) push(`- ${pairing.label}: ${pairing.foreground} on ${pairing.background} = ${pairing.ratio}:1 (${pairing.wcag})`);
  push("");

  push("## Typography", "");
  for (const family of guide.typography.families) {
    push(`- **${family.name}** (${family.category}, ${family.source}) for ${family.usedFor.join(", ") || "supporting text"}. Weights: ${family.weights.join(", ") || "n/a"}. Stack: \`${family.stack}\``);
  }
  push("", "| Role | Family | Size | Weight | Line height | Tracking |", "|---|---|---|---|---|---|");
  for (const style of guide.typography.scale) {
    push(`| ${style.role} | ${style.family} | ${style.sizePx}px | ${style.weight} | ${style.lineHeight ?? "normal"} | ${style.letterSpacingEm}em |`);
  }
  push("");

  push("## Tone of voice", "", voice.summary, "");
  for (const trait of voice.traits) {
    push(`### ${trait.name}`, "", trait.description, "", `- **Do:** ${trait.do}`, `- **Don't:** ${trait.dont}`, "");
    for (const evidence of trait.evidence) push(quote(evidence));
    push("");
  }
  const spectrum = voice.toneSpectrum;
  push(
    "**Tone spectrum** (0 to 100)",
    "",
    `- Formal ${spectrum.formalToCasual} Casual`,
    `- Serious ${spectrum.seriousToPlayful} Playful`,
    `- Technical ${spectrum.technicalToPlain} Plain`,
    `- Understated ${spectrum.understatedToBold} Bold`,
    "",
    "**Style rules**",
    "",
    ...voice.styleRules.map((rule) => `- ${rule}`),
    "",
    `**Words we use:** ${voice.preferredWords.join(", ")}`,
    "",
    `**Words we avoid:** ${voice.wordsToAvoid.join(", ")}`,
    "",
    `**Measured:** ${voice.metrics.averageSentenceWords} words per sentence, reading ease ${voice.metrics.readingEase} (${voice.metrics.readingLevel}), headings in ${voice.metrics.headingCase}, "you" ${voice.metrics.youPer100Words} per 100 words vs "we" ${voice.metrics.wePer100Words}.`,
    "",
  );

  push("## Messaging", "");
  for (const audience of messaging.audiences) push(`- **${audience.name}:** ${audience.need}`);
  push("");
  for (const pillar of messaging.pillars) {
    push(`### ${pillar.headline}`, "", pillar.message, "");
    for (const proof of pillar.proof) push(quote(proof));
    push("");
  }
  if (messaging.proofPoints.length) push("**Proof points**", "", ...messaging.proofPoints.map(quote), "");
  if (messaging.keyPhrases.length) push(`**Key phrases:** ${messaging.keyPhrases.map((phrase) => `"${phrase}"`).join(", ")}`, "");
  if (messaging.ctas.length) push(`**Calls to action:** ${messaging.ctas.join(" · ")}`, "");

  push("## Sources", "", ...guide.sources.pages.map((page) => `- ${page.kind}: ${page.url}`), "");
  return lines.join("\n");
}

/** Button colours arrive as computed CSS strings; show them as hex in the UI. */
export function cssColorToHex(value: string): string {
  const parsed = parseColor(value);
  return parsed ? toHex(parsed) : value;
}
