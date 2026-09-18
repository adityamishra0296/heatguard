import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project directory so Next does not infer a
  // parent folder when unrelated lockfiles exist elsewhere on the machine.
  turbopack: {
    root: import.meta.dirname,
  },
  // puppeteer-core is used only by the server-side PDF route and drives an
  // external system browser; keep it out of the bundle/trace so its dynamic
  // internals are not analysed.
  serverExternalPackages: ["puppeteer-core"],
};

export default nextConfig;
