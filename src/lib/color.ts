// Colour parsing and maths. Chrome reports computed colours as rgb()/rgba(), but sites
// authored in modern CSS come back as oklch(), lab(), color(srgb ...) and friends.

export interface Rgba {
  r: number; // 0-255
  g: number;
  b: number;
  a: number; // 0-1
}

export interface Oklab {
  l: number;
  a: number;
  b: number;
}

const clamp = (value: number, min = 0, max = 255) => Math.min(max, Math.max(min, value));

export function parseColor(input: string): Rgba | null {
  const value = input.trim().toLowerCase();
  if (value.startsWith("#")) return parseHex(value);

  const match = value.match(/^([a-z]+)\((.*)\)$/);
  if (!match) return null;
  const [, fn, body] = match;
  const [channelsPart, alphaPart] = body.includes("/") ? body.split("/") : [body, undefined];
  const channels = channelsPart.replace(/,/g, " ").trim().split(/\s+/);
  const legacyAlpha = !alphaPart && channels.length === 4 ? channels.pop() : undefined;
  const alpha = parseAlpha(alphaPart ?? legacyAlpha);

  switch (fn) {
    case "rgb":
    case "rgba": {
      const [r, g, b] = channels.map((c) => (c.endsWith("%") ? (parseFloat(c) / 100) * 255 : parseFloat(c)));
      return valid({ r, g, b, a: alpha });
    }
    case "hsl":
    case "hsla": {
      const [h, s, l] = channels.map((c) => parseFloat(c));
      return valid({ ...hslToRgb(h, s / 100, l / 100), a: alpha });
    }
    case "oklch": {
      const [l, c, h] = channels.map(parseLightnessAware(1));
      const hue = ((h || 0) * Math.PI) / 180;
      return valid({ ...oklabToRgb({ l, a: c * Math.cos(hue), b: c * Math.sin(hue) }), a: alpha });
    }
    case "oklab": {
      const [l, a, b] = channels.map(parseLightnessAware(1));
      return valid({ ...oklabToRgb({ l, a, b }), a: alpha });
    }
    case "lab": {
      const [l, a, b] = channels.map(parseLightnessAware(100));
      return valid({ ...labToRgb(l, a, b), a: alpha });
    }
    case "lch": {
      const [l, c, h] = channels.map(parseLightnessAware(100));
      const hue = ((h || 0) * Math.PI) / 180;
      return valid({ ...labToRgb(l, c * Math.cos(hue), c * Math.sin(hue)), a: alpha });
    }
    case "color": {
      const [space, ...rest] = channels;
      if (space !== "srgb" && space !== "display-p3") return null;
      const [r, g, b] = rest.map((c) => parseFloat(c) * 255);
      return valid({ r, g, b, a: alpha });
    }
    default:
      return null;
  }
}

function parseLightnessAware(percentScale: number) {
  return (channel: string) => (channel.endsWith("%") ? (parseFloat(channel) / 100) * percentScale : parseFloat(channel));
}

function parseAlpha(part: string | undefined): number {
  if (!part) return 1;
  const trimmed = part.trim();
  return trimmed.endsWith("%") ? parseFloat(trimmed) / 100 : parseFloat(trimmed);
}

function parseHex(value: string): Rgba | null {
  let hex = value.slice(1);
  if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(hex)) return null;
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
  };
}

function valid(color: Rgba): Rgba | null {
  if ([color.r, color.g, color.b, color.a].some((n) => typeof n !== "number" || !Number.isFinite(n))) return null;
  return { r: clamp(color.r), g: clamp(color.g), b: clamp(color.b), a: clamp(color.a, 0, 1) };
}

function hslToRgb(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
function encodeSrgb(v: number): number {
  const clamped = Math.min(1, Math.max(0, v));
  return 255 * (clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055);
}

export function rgbToOklab({ r, g, b }: Rgba): Oklab {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToRgb({ l, a, b }: Oklab) {
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: encodeSrgb(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    g: encodeSrgb(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    b: encodeSrgb(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  };
}

// CIE Lab (D50, as CSS defines it) -> sRGB.
function labToRgb(L: number, A: number, B: number) {
  const fy = (L + 16) / 116, fx = fy + A / 500, fz = fy - B / 200;
  const inv = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const x = 0.3457 / 0.3585 * inv(fx), y = inv(fy), z = (1 - 0.3457 - 0.3585) / 0.3585 * inv(fz);
  // Bradford D50 -> D65, then XYZ -> linear sRGB.
  const x65 = 0.9554734527042182 * x - 0.023098536874261423 * y + 0.0632593086610217 * z;
  const y65 = -0.028369706963208136 * x + 1.0099954580058226 * y + 0.021041398966943008 * z;
  const z65 = 0.012314001688319899 * x - 0.020507696433477912 * y + 1.3303659366080753 * z;
  return {
    r: encodeSrgb(3.2409699419 * x65 - 1.5373831776 * y65 - 0.4986107603 * z65),
    g: encodeSrgb(-0.9692436363 * x65 + 1.8759675015 * y65 + 0.0415550574 * z65),
    b: encodeSrgb(0.0556300797 * x65 - 0.2039769589 * y65 + 1.0569715142 * z65),
  };
}

export function blend(top: Rgba, under: Rgba): Rgba {
  const a = top.a;
  return { r: top.r * a + under.r * (1 - a), g: top.g * a + under.g * (1 - a), b: top.b * a + under.b * (1 - a), a: 1 };
}

export function toHex({ r, g, b }: Rgba): string {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function toHsl({ r, g, b }: Rgba): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  h *= 60;
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function toCmyk({ r, g, b }: Rgba): { c: number; m: number; y: number; k: number } {
  const k = 1 - Math.max(r, g, b) / 255;
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
  const f = (channel: number) => Math.round(((1 - channel / 255 - k) / (1 - k)) * 100);
  return { c: f(r), m: f(g), y: f(b), k: Math.round(k * 100) };
}

export function chroma(color: Rgba): number {
  const { a, b } = rgbToOklab(color);
  return Math.hypot(a, b);
}

export function hueDegrees(color: Rgba): number {
  const { a, b } = rgbToOklab(color);
  return ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
}

export function distance(first: Rgba, second: Rgba): number {
  const x = rgbToOklab(first), y = rgbToOklab(second);
  return Math.hypot(x.l - y.l, x.a - y.a, x.b - y.b);
}

export function relativeLuminance({ r, g, b }: Rgba): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(first: Rgba, second: Rgba): number {
  const [light, dark] = [relativeLuminance(first), relativeLuminance(second)].sort((x, y) => y - x);
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
}

export function wcagLevel(ratio: number): "AAA" | "AA" | "AA Large" | "Fail" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

/** A plain descriptive name a designer can read: "Deep Blue", "Light Gray", "Vivid Orange". */
export function describeColor(color: Rgba): string {
  const { l } = rgbToOklab(color);
  const c = chroma(color);
  if (c < 0.025) {
    if (l > 0.97) return "White";
    if (l < 0.18) return "Black";
    return l > 0.75 ? "Light Gray" : l > 0.45 ? "Gray" : "Dark Gray";
  }
  const h = hueDegrees(color);
  if (c < 0.06) {
    const temperature = h > 180 && h < 300 ? "Blue Gray" : "Warm Gray";
    return l > 0.85 ? `Pale ${temperature}` : l > 0.65 ? `Light ${temperature}` : l < 0.35 ? `Deep ${temperature}` : temperature;
  }
  const hues: [number, string][] = [
    [20, "Pink"], [45, "Red"], [70, "Orange"], [100, "Amber"], [115, "Yellow"], [140, "Lime"],
    [165, "Green"], [195, "Teal"], [230, "Cyan"], [265, "Blue"], [290, "Indigo"], [320, "Violet"], [350, "Purple"], [361, "Pink"],
  ];
  let hueName = hues.find(([limit]) => h < limit)?.[1] ?? "Pink";
  if (hueName === "Orange" && l < 0.55) hueName = "Brown";
  const tone = l > 0.85 ? "Pale" : l > 0.7 ? "Light" : l < 0.35 ? "Deep" : c > 0.17 ? "Vivid" : l < 0.5 ? "Dark" : "";
  return tone ? `${tone} ${hueName}` : hueName;
}
