import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const corsHeaders = [
  { key: "Access-Control-Allow-Origin", value: "http://localhost:3500" },
  { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
  { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
  { key: "Vary", value: "Origin" },
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
