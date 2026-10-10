// Formats other tools can consume directly:
//   tokens   -> W3C Design Tokens (DTCG) JSON: Tokens Studio for Figma, Style Dictionary
//   css      -> :root custom properties
//   tailwind -> Tailwind v4 @theme block
//   md       -> a Markdown brand guide for docs, Notion or speaker notes
//   design   -> DESIGN.md (google-labs-code/design.md): YAML tokens + prose that coding agents and Stitch read

import { parseColor, toHex } from "./color";
import type { BrandColor, BrandGuide, ColorRole, TypeStyle } from "./types";

export type ExportFormat = "json" | "tokens" | "css" | "tailwind" | "md" | "design";

export const EXPORTS: Record<ExportFormat, { label: string; contentType: string; extension: string }> = {
  json: { label: "Brand guide JSON", contentType: "application/json", extension: "brand.json" },
  tokens: { label: "Design tokens (W3C / Figma Tokens Studio)", contentType: "application/json", extension: "tokens.json" },
  css: { label: "CSS variables", contentType: "text/css", extension: "brand.css" },
  tailwind: { label: "Tailwind v4 theme", contentType: "text/css", extension: "tailwind.css" },
  md: { label: "Markdown brand guide", contentType: "text/markdown", extension: "brand-guide.md" },
  design: { label: "DESIGN.md (for AI agents)", contentType: "text/markdown", extension: "DESIGN.md" },
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
    case "design":
      return toDesignMd(guide);
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

// DESIGN.md (https://github.com/google-labs-code/design.md, version "alpha"). Token names use the
// spec's recommended names where a role maps cleanly; the spec accepts any other name.
const DESIGN_COLOR_NAMES: Record<ColorRole, string[]> = {
  primary: ["primary"],
  accent: ["secondary", "tertiary"],
  background: ["background"],
  surface: ["surface"],
  text: ["on-surface"],
  "muted-text": ["on-surface-variant"],
  neutral: ["neutral"],
  official: ["official"],
};

const DESIGN_COLOR_ROLES: Record<ColorRole, string> = {
  primary: "Primary brand colour",
  accent: "Accent",
  background: "Page background",
  surface: "Surface for cards and sections",
  text: "Main text",
  "muted-text": "Secondary text",
  neutral: "Neutral",
  official: "Official colour from the brand's own guidelines",
};

const DESIGN_TYPE_NAMES: Record<TypeStyle["role"], string> = {
  display: "headline-display",
  heading: "headline-lg",
  subheading: "headline-md",
  body: "body-md",
  navigation: "label-md",
  button: "label-lg",
  code: "code",
};

const BUTTON_NAMES = ["button-primary", "button-secondary", "button-tertiary"];

function designColorNames(palette: BrandColor[]): { token: string; color: BrandColor }[] {
  const counts = new Map<ColorRole, number>();
  return palette.map((color) => {
    const index = counts.get(color.role) ?? 0;
    counts.set(color.role, index + 1);
    const base = color.role === "accent" ? "accent" : DESIGN_COLOR_NAMES[color.role][0];
    return { token: DESIGN_COLOR_NAMES[color.role][index] ?? `${base}-${index + 1}`, color };
  });
}

/** "4px" -> sm, "9999px" or "50%" -> full. Null when the computed radius is not a length. */
function radiusLevel(radius: string): { level: string; value: string } | null {
  const px = Number.parseFloat(radius);
  if (radius.trim().endsWith("%") || px >= 999) return { level: "full", value: "9999px" };
  if (!Number.isFinite(px)) return null;
  const level = px <= 0 ? "none" : px <= 4 ? "sm" : px <= 8 ? "md" : px <= 16 ? "lg" : "xl";
  return { level, value: `${round(px)}px` };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function toneWords(spectrum: BrandGuide["voice"]["toneSpectrum"]): string {
  const axes: [number, string, string][] = [
    [spectrum.formalToCasual, "formal", "casual"],
    [spectrum.seriousToPlayful, "serious", "playful"],
    [spectrum.technicalToPlain, "technical", "plain-spoken"],
    [spectrum.understatedToBold, "understated", "bold"],
  ];
  return axes.map(([value, low, high]) => (value <= 35 ? low : value >= 65 ? high : `between ${low} and ${high}`)).join(", ");
}

function toDesignMd(guide: BrandGuide): string {
  const { brand, voice } = guide;
  const q = (value: string) => JSON.stringify(value); // a JSON string is a valid YAML double-quoted scalar
  const colors = designColorNames(guide.colors.palette);
  const colorRef = new Map(colors.map(({ token, color }) => [color.hex.toUpperCase(), `{colors.${token}}`]));
  const primary = colors.find(({ color }) => color.role === "primary");

  const typeStyles = guide.typography.scale.filter((style, index, scale) => scale.findIndex((other) => other.role === style.role) === index);

  // Buttons: the one filled with the primary colour comes first, so it becomes button-primary.
  const buttons = guide.components.buttons
    .map((button) => {
      const background = parseColor(button.background);
      const text = parseColor(button.color);
      const hexOrCss = (parsed: ReturnType<typeof parseColor>, raw: string) => (parsed && parsed.a >= 1 ? toHex(parsed) : raw);
      return { button, background: hexOrCss(background, button.background), text: hexOrCss(text, button.color), radius: radiusLevel(button.radius) };
    })
    .sort((a, b) => Number(b.background === primary?.color.hex) - Number(a.background === primary?.color.hex));
  const rounded = new Map<string, string>();
  for (const { radius } of buttons) if (radius && !rounded.has(radius.level)) rounded.set(radius.level, radius.value);

  const yaml: string[] = ["---", "version: alpha", `name: ${q(brand.name)}`, `description: ${q(brand.tagline ?? brand.elevatorPitch)}`, "colors:"];
  for (const { token, color } of colors) yaml.push(`  ${token}: ${q(color.hex)}`);
  if (primary) yaml.push(`  on-primary: ${q(primary.color.bestTextColor)}`);
  if (typeStyles.length) yaml.push("typography:");
  for (const style of typeStyles) {
    yaml.push(`  ${DESIGN_TYPE_NAMES[style.role]}:`, `    fontFamily: ${q(style.family)}`, `    fontSize: ${round(style.sizePx)}px`, `    fontWeight: ${style.weight}`);
    if (style.lineHeight !== null) yaml.push(`    lineHeight: ${round(style.lineHeight)}`);
    yaml.push(`    letterSpacing: ${round(style.letterSpacingEm)}em`);
  }
  if (rounded.size) yaml.push("rounded:", ...[...rounded].map(([level, value]) => `  ${level}: ${value}`));
  if (buttons.length) yaml.push("components:");
  const buttonType = typeStyles.find((style) => style.role === "button");
  buttons.forEach(({ button, background, text, radius }, index) => {
    yaml.push(
      `  ${BUTTON_NAMES[index] ?? `button-${index + 1}`}:`,
      `    backgroundColor: ${q(colorRef.get(background) ?? background)}`,
      `    textColor: ${q(background === primary?.color.hex && text === primary.color.bestTextColor ? "{colors.on-primary}" : (colorRef.get(text) ?? text))}`,
    );
    if (buttonType) yaml.push(`    typography: ${q(`{typography.${DESIGN_TYPE_NAMES.button}}`)}`);
    if (radius) yaml.push(`    rounded: ${q(`{rounded.${radius.level}}`)}`);
    yaml.push(`    padding: ${q(button.padding)}`);
  });
  yaml.push("---");

  const lines: string[] = [];
  const push = (...items: string[]) => lines.push(...items);
  push(
    `# ${brand.name}`,
    "",
    `Extracted from ${brand.url} on ${guide.generatedAt.slice(0, 10)} by Brand Guide Generator. Colours, type and components were measured on the rendered site, and every quote was checked against the page it came from. This describes the live site; it is not an official brand guide.`,
    "",
  );

  push("## Overview", "", brand.elevatorPitch, "", voice.summary, "", `Tone: ${toneWords(voice.toneSpectrum)}.`, "");
  if (guide.messaging.audiences.length) push(`Audiences: ${guide.messaging.audiences.map((audience) => audience.name).join("; ")}.`, "");

  push("## Colors", "", `${colors.length} colours, ordered by role. Share is how much of the rendered page each one covers.`, "");
  for (const { token, color } of colors) {
    const seen = color.evidence.slice(0, 2).join("; ");
    push(`- **${color.name} (${color.hex}):** ${DESIGN_COLOR_ROLES[color.role]} (\`${token}\`), ${color.share}% of the page.${seen ? ` Seen as: ${seen}.` : ""}`);
  }
  if (primary) push(`- **On primary (${primary.color.bestTextColor}):** Text and icons on the primary colour (\`on-primary\`), the higher-contrast of black and white. Computed, not measured; the site's own buttons are under Components.`);
  push("");

  if (typeStyles.length) {
    push("## Typography", "");
    for (const family of guide.typography.families) {
      push(`- **${family.name}** (${family.source}, ${family.category}) for ${family.usedFor.join(", ") || "supporting text"}. Weights ${family.weights.join(", ") || "n/a"}. Stack: \`${family.stack}\`.`);
    }
    push("");
    for (const style of typeStyles) {
      const lineHeight = style.lineHeight === null ? "" : `, line height ${round(style.lineHeight)}`;
      const tracking = style.letterSpacingEm ? `, tracking ${round(style.letterSpacingEm)}em` : "";
      const transform = style.transform && style.transform !== "none" ? `, ${style.transform}` : "";
      push(`- **${style.role[0].toUpperCase()}${style.role.slice(1)}** (\`${DESIGN_TYPE_NAMES[style.role]}\`): ${style.family} ${round(style.sizePx)}px, weight ${style.weight}${lineHeight}${tracking}${transform}.`);
    }
    push("", `Headings are set in ${voice.metrics.headingCase.toLowerCase()}.`, "");
  }

  if (rounded.size) {
    push("## Shapes", "", `Measured on buttons: ${[...rounded].map(([level, value]) => `${value} corners (\`rounded.${level}\`)`).join(", ")}.`, "");
  }

  if (buttons.length) {
    push("## Components", "");
    buttons.forEach(({ button, background, text }, index) => {
      push(`- **${BUTTON_NAMES[index] ?? `button-${index + 1}`}** ("${button.text}"): ${background} background, ${text} text, ${button.radius} radius, padding ${button.padding}, weight ${button.weight}.`);
    });
    push("");
  }

  push("## Do's and Don'ts", "");
  for (const pairing of guide.colors.pairings) {
    push(
      pairing.wcag === "Fail"
        ? `- Don't use ${pairing.foreground} on ${pairing.background} for text (${pairing.label.toLowerCase()}): ${pairing.ratio}:1 fails WCAG.`
        : `- Do use ${pairing.foreground} on ${pairing.background} for ${pairing.label.toLowerCase()} (${pairing.ratio}:1, WCAG ${pairing.wcag}).`,
    );
  }
  for (const trait of voice.traits) push(`- Do (${trait.name}): ${trait.do}`, `- Don't (${trait.name}): ${trait.dont}`);
  if (voice.wordsToAvoid.length) push(`- Don't use these words in copy: ${voice.wordsToAvoid.join(", ")}.`);
  push("");

  push("## Voice", "", ...voice.styleRules.map((rule) => `- ${rule}`), "");
  if (voice.preferredWords.length) push(`Words they use: ${voice.preferredWords.join(", ")}.`, "");
  const sample = voice.traits.flatMap((trait) => trait.evidence).slice(0, 3);
  if (sample.length) push("How it sounds on their site:", "", ...sample.map((evidence) => `> "${evidence.quote}" (${evidence.sourceUrl})`), "");

  const logo = guide.logo.primary;
  if (logo?.svg && logo.svg.length <= 8000) push("## Logo", "", "```svg", logo.svg, "```", "");
  else if (logo?.url) push("## Logo", "", `- ${logo.url}`, "");

  return [...yaml, "", ...lines].join("\n");
}

/** Button colours arrive as computed CSS strings; show them as hex in the UI. */
export function cssColorToHex(value: string): string {
  const parsed = parseColor(value);
  return parsed ? toHex(parsed) : value;
}
