import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ship the Wasm engine and the syntax spec with the server functions that read them from disk.
  outputFileTracingIncludes: {
    "/api/**/*": ["./public/wasm/slide_engine_bg.wasm", "./public/llms-full.txt"],
  },
  async headers() {
    return [
      {
        source: "/wasm/:file*",
        headers: [
          { key: "Content-Type", value: "application/wasm" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
