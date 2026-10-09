// Pre-generated guides in /examples, rendered statically so the demo loads instantly.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { BrandGuide } from "./types";

const EXAMPLES_DIR = path.join(process.cwd(), "examples");

export async function listExamples(): Promise<{ slug: string; guide: BrandGuide }[]> {
  const entries = await readdir(EXAMPLES_DIR, { withFileTypes: true }).catch(() => []);
  const guides = await Promise.all(
    entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
      const guide = await loadExample(entry.name);
      return guide ? { slug: entry.name, guide } : null;
    }),
  );
  return guides.filter((item): item is { slug: string; guide: BrandGuide } => item !== null).sort((a, b) => a.guide.brand.name.localeCompare(b.guide.brand.name));
}

export async function loadExample(slug: string): Promise<BrandGuide | null> {
  if (!/^[a-z0-9.-]+$/i.test(slug)) return null;
  const raw = await readFile(path.join(EXAMPLES_DIR, slug, "brand.json"), "utf8").catch(() => null);
  return raw ? (JSON.parse(raw) as BrandGuide) : null;
}
