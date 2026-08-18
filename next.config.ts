import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

// Local dev render backend: any localhost host can embed the catalog (Hudson
// :3500, Atelier :3034, standalone :3100, …). A static header can only emit one
// origin and can't echo the request, so a hardcoded :3500 silently breaks every
// other embedder's cross-origin probe. Wildcard is fine here — preframe binds to
// localhost only and these endpoints are unauthenticated (no Allow-Credentials).
const corsHeaders = [
  { key: "Access-Control-Allow-Origin", value: "*" },
  { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
  { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ["hudsonkit"],
  serverExternalPackages: ["better-sqlite3"],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: corsHeaders,
      },
      {
        source: "/catalog-data.json",
        headers: corsHeaders,
      },
      {
        source: "/curated-snippets.json",
        headers: corsHeaders,
      },
    ];
  },
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      "hudsonkit": "./node_modules/hudsonkit/src/index.ts",
      "hudsonkit/app-shell": "./node_modules/hudsonkit/src/app-shell.ts",
      "hudsonkit/controls": "./node_modules/hudsonkit/src/controls.ts",
      "hudsonkit/player": "./node_modules/hudsonkit/src/player.ts",
      "hudsonkit/styles": "./node_modules/hudsonkit/dist/styles.css",
      "@voxd/client": "./lib/stub.ts",
      // xterm aliases removed — the Frame Designer's Assistant needs the
      // real package for its relay terminal. The stub was here to skip
      // bundling xterm when no app used it; keep stubs only for genuinely
      // unused optional peers.
      "html2canvas-pro": "./lib/stub.ts",
    },
  },
};

export default nextConfig;
