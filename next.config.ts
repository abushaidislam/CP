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
};

export default nextConfig;
