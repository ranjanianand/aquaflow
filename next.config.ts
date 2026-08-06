import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // Bundles only the files the server actually needs, so the deployed image
  // carries a runtime rather than the whole node_modules tree.
  output: "standalone",

  // Pin the tracing root to this project.
  //
  // Next walks upwards looking for a workspace root, and on this machine it
  // finds one in the home directory — so the standalone build emitted
  // .next/standalone/OneDrive/Desktop/MWTS/git/aquaflow/server.js instead of
  // .next/standalone/server.js. The Dockerfile's COPY then lands a directory
  // tree with no server.js at its root and the container exits immediately.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
