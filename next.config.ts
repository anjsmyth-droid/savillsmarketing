import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Allows the dev server to accept requests (including Server Actions)
  // when accessed through a forwarded/proxied hostname rather than
  // localhost — e.g. GitHub Codespaces or Gitpod port forwarding. Next.js
  // otherwise rejects these as a cross-origin security measure. Dev-only;
  // has no effect on production builds.
  allowedDevOrigins: ["*.app.github.dev", "*.githubpreview.dev", "*.gitpod.io"],
};

export default nextConfig;
