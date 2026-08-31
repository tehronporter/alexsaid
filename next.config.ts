import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The dev overlay portal is anchored bottom-left, over the onboarding sheet's
  // footer buttons, and intercepts pointer events on small viewports. Dev only.
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return process.env.SAID_PRODUCT === "leila"
      ? [{ source: "/app", destination: "/", permanent: true }]
      : [];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" }
        ]
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};

export default nextConfig;
