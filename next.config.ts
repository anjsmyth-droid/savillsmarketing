import type { NextConfig } from "next";

// Domains this dev server should trust when accessed through a
// forwarded/proxied hostname rather than localhost — e.g. GitHub
// Codespaces, Gitpod, or Replit's preview domains. Dev-only; has no
// effect on production builds. The "**." prefix (vs "*.") matches any
// number of subdomain labels, which Replit's preview hostnames need.
const forwardedDevOrigins = [
  "*.app.github.dev",
  "*.githubpreview.dev",
  "*.gitpod.io",
  "**.replit.dev",
  "**.repl.co",
  "**.replit.app",
];

const nextConfig: NextConfig = {
  /* config options here */

  // Covers cross-origin dev requests for assets/HMR.
  allowedDevOrigins: forwardedDevOrigins,

  experimental: {
    // Covers the separate CSRF check Next.js runs specifically on Server
    // Action requests — without this, submitting any form behind a
    // forwarded origin fails with "Invalid Server Actions request."
    serverActions: {
      allowedOrigins: forwardedDevOrigins,
    },
  },
};

export default nextConfig;
