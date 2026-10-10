// Usage: npm run exports [examplesDir]
// Rewrites every export in <examplesDir>/<slug>/ from its saved brand.json. No network calls,
// so a new or changed exporter reaches the examples without re-crawling the sites.

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { exportGuide, EXPORTS, type ExportFormat } from "../src/lib/exporters";
import type { BrandGuide } from "../src/lib/types";

const dir = process.argv[2] ?? "examples";
const entries = await readdir(dir, { withFileTypes: true });
let written = 0;
for (const entry of entries.filter((item) => item.isDirectory())) {
  const raw = await readFile(path.join(dir, entry.name, "brand.json"), "utf8").catch(() => null);
  if (!raw) {
    console.log(`skip ${entry.name}: no brand.json`);
    continue;
  }
  const guide = JSON.parse(raw) as BrandGuide;
  for (const format of Object.keys(EXPORTS) as ExportFormat[]) {
    if (format === "json") continue; // the source itself
    await writeFile(path.join(dir, entry.name, EXPORTS[format].extension), exportGuide(guide, format));
    written += 1;
  }
  console.log(`wrote ${entry.name}`);
}
console.log(`${written} files across ${entries.length} folders`);
