import type { NextConfig } from "next";

const config: NextConfig = {
  // playwright-core only connects to the TinyFish remote browser over CDP; keep it out of the bundle.
  serverExternalPackages: ["playwright-core"],
  outputFileTracingIncludes: {
    "/": ["./examples/**/brand.json"],
    "/g/\\[slug\\]": ["./examples/**/brand.json"],
    // playwright-core reads browsers.json (and other data files) from disk at import time; the tracer misses them.
    "/api/brand-guide": ["./node_modules/playwright-core/**/*"],
  },
};

export default config;
