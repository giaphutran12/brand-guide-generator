// Typography from computed styles: which families carry headings, body and code,
// where each font is served from, and the type scale per role.

import { parseColor, toHex } from "./color";
import { log } from "./log";
import type { RawPageStyles, RawStyle } from "./page-script";
import type { FontFamily, TypeStyle } from "./types";

const SYSTEM_FONTS = /^(-apple-system|blinkmacsystemfont|system-ui|ui-sans-serif|ui-serif|ui-monospace|segoe ui|roboto|helvetica neue|helvetica|arial|sans-serif|serif|monospace|sf pro( display| text)?|menlo|consolas|courier new|times new roman|georgia)$/i;

/** "__Inter_d65c78, __Inter_Fallback_d65c78, sans-serif" -> "__Inter_d65c78" */
function firstFamily(stack: string): string {
  return (stack.split(",")[0] ?? "").replace(/["']/g, "").trim();
}

/** Undo framework font hashing: "__Inter_d65c78" -> "Inter", "sohne-var" -> "Sohne Var". */
export function readableFamilyName(cssName: string): string {
  const unhashed = cssName
    .replace(/^__/, "")
    .replace(/_[0-9a-f]{5,8}$/i, "")
    .replace(/_Fallback$/i, "")
    .replace(/[_]+/g, " ")
    .trim();
  if (/[A-Z]/.test(unhashed)) return unhashed;
  return unhashed.replace(/[-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Category comes from the family's own name and the generic keyword that ends the stack,
// never from fallbacks in between ("sohne-var, SF Pro Display, sans-serif" is sans-serif).
function category(stack: string, name: string): FontFamily["category"] {
  const lowerName = name.toLowerCase();
  const generic = (stack.split(",").at(-1) ?? "").replace(/["']/g, "").trim().toLowerCase();
  if (/mono|code|courier|consolas|menlo/.test(lowerName) || generic === "monospace" || generic === "ui-monospace") return "monospace";
  if (/garamond|times|georgia|tiempos|playfair|caslon|baskerville|lora|merriweather|serif display|signifier|freight/.test(lowerName) || generic === "serif" || generic === "ui-serif") return "serif";
  if (/script|hand|brush/.test(lowerName) || generic === "cursive" || generic === "fantasy") return "display";
  return "sans-serif";
}

export function buildTypography(styles: RawPageStyles, primaryHex: string | null) {
  // The button style is the primary call to action as rendered, not the first <button> (often a nav toggle).
  const primaryCta =
    styles.ctas.find((cta) => primaryHex && cssColorToHex(cta.background) === primaryHex) ?? styles.ctas[0];
  const roles: Record<string, RawStyle | null> = {
    ...styles.roles,
    button: primaryCta
      ? { family: primaryCta.family, weight: primaryCta.weight, size: primaryCta.size, lineHeight: primaryCta.lineHeight, letterSpacing: primaryCta.letterSpacing, transform: primaryCta.transform, color: primaryCta.color, sample: primaryCta.text }
      : null, // without a real call to action, the first <button> is usually a toggle or menu
  };
  const roleEntries = Object.entries(roles).filter((entry): entry is [string, RawStyle] => entry[1] !== null);
  const totalChars = Object.values(styles.fontUsage).reduce((sum, count) => sum + count, 0) || 1;

  const byFamily = new Map<string, { stack: string; usedFor: Set<string>; chars: number; weights: Set<number> }>();
  const touch = (stack: string) => {
    const cssName = firstFamily(stack);
    if (!cssName) return null;
    const entry = byFamily.get(cssName) ?? { stack, usedFor: new Set<string>(), chars: 0, weights: new Set<number>() };
    byFamily.set(cssName, entry);
    return entry;
  };
  for (const [stack, chars] of Object.entries(styles.fontUsage)) {
    const entry = touch(stack);
    if (entry) entry.chars += chars;
  }
  for (const [role, style] of roleEntries) {
    const entry = touch(style.family);
    if (!entry) continue;
    entry.usedFor.add(role);
    entry.weights.add(parseInt(style.weight, 10));
  }

  const families: FontFamily[] = [...byFamily.entries()]
    .filter(([, entry]) => entry.usedFor.size > 0 || entry.chars / totalChars > 0.05)
    .sort((a, b) => b[1].usedFor.size - a[1].usedFor.size || b[1].chars - a[1].chars)
    .slice(0, 4)
    .map(([cssName, entry]) => {
      const name = readableFamilyName(cssName);
      const token = name.split(" ")[0].toLowerCase();
      const faces = styles.fontFaces.filter((face) => face.family.toLowerCase() === cssName.toLowerCase());
      for (const face of faces) {
        for (const weight of face.weight.split(/\s+/).map((w) => parseInt(w, 10))) if (weight) entry.weights.add(weight);
      }
      const faceFiles = faces.flatMap((face) => [...face.src.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]));
      const namedFiles = styles.fontFiles.filter((file) => decodeURIComponent(file).toLowerCase().includes(token));
      const files = [...new Set([...faceFiles, ...namedFiles])].filter((file) => !file.startsWith("data:")).slice(0, 8);
      return {
        name,
        cssName,
        usedFor: [...entry.usedFor],
        stack: entry.stack,
        category: category(entry.stack, name),
        weights: [...entry.weights].filter((w) => !Number.isNaN(w)).sort((a, b) => a - b),
        source: fontSource(cssName, name, files, styles),
        files,
        share: Math.round((entry.chars / totalChars) * 1000) / 10,
      };
    });

  const scale: TypeStyle[] = roleEntries.map(([role, style]) => {
    const sizePx = parseFloat(style.size);
    const lineHeightPx = parseFloat(style.lineHeight);
    const letterSpacingPx = parseFloat(style.letterSpacing);
    return {
      role: role as TypeStyle["role"],
      family: readableFamilyName(firstFamily(style.family)),
      sizePx: Math.round(sizePx * 10) / 10,
      weight: parseInt(style.weight, 10) || 400,
      lineHeight: Number.isFinite(lineHeightPx) && sizePx ? Math.round((lineHeightPx / sizePx) * 100) / 100 : null,
      letterSpacingEm: Number.isFinite(letterSpacingPx) && sizePx ? Math.round((letterSpacingPx / sizePx) * 1000) / 1000 : 0,
      transform: style.transform,
      color: style.color,
      sample: style.sample,
    };
  });

  log("typography.built", {
    families: families.length,
    names: families.map((family) => family.name.replace(/\s+/g, "_")).join(","),
    sources: families.map((family) => family.source.replace(/\s+/g, "_")).join(","),
    roles: scale.length,
  });
  return { families, scale };
}

function fontSource(cssName: string, name: string, files: string[], styles: RawPageStyles): FontFamily["source"] {
  const plus = name.replace(/\s+/g, "+").toLowerCase();
  const sheets = styles.fontStylesheets.map((sheet) => decodeURIComponent(sheet).toLowerCase());
  if (sheets.some((sheet) => sheet.includes("fonts.googleapis") && sheet.includes(plus)) || files.some((file) => file.includes("fonts.gstatic.com"))) {
    return "Google Fonts";
  }
  if (sheets.some((sheet) => sheet.includes("typekit")) && files.some((file) => /typekit|use\.typekit/.test(file))) return "Adobe Fonts";
  if (files.length > 0) return "self-hosted";
  if (SYSTEM_FONTS.test(cssName)) return "system";
  // A named non-system family on a page that loaded its own font files is a custom or licensed face.
  if (styles.fontFiles.length > 0 || styles.fontFaces.length > 0) return "self-hosted";
  return "unknown";
}

function cssColorToHex(value: string): string | null {
  const parsed = parseColor(value);
  return parsed ? toHex(parsed) : null;
}
