import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // Static export: plain HTML, CSS and JS that nginx serves directly, with no
  // Node process in production.
  //
  // Viable because every route is client-rendered — the build reports them all
  // as static. Nothing here uses server components for data, server actions,
  // route handlers or image optimisation, which are the features `export`
  // removes. All data arrives from the API in the browser.
  output: "export",

  // Emits /monitoring/index.html rather than /monitoring.html, so nginx
  // resolves a bare directory path without any rewrite rules.
  trailingSlash: true,

  // next/image needs a server to optimise. Static export has none, so the
  // images are passed through unchanged.
  images: { unoptimized: true },

  // Pin the tracing root to this project. Next walks upwards looking for a
  // workspace root and finds one in the home directory on this machine, which
  // sends build output five directories deep under OneDrive/.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
