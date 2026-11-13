import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "*.run.app",
    "ais-dev-wvssokgshakuhhubiepyef-410246434679.asia-southeast1.run.app",
    "ais-pre-wvssokgshakuhhubiepyef-410246434679.asia-southeast1.run.app",
    "ais-dev-tz3utjid7yj3cvw3fuytqc-410246434679.asia-southeast1.run.app",
    "ais-pre-tz3utjid7yj3cvw3fuytqc-410246434679.asia-southeast1.run.app",
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
