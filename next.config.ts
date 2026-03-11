import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-9c4e1eed-d2e8-4766-a6c1-2fa5de64677d.space.z.ai',
    '.space.z.ai',
    'localhost',
    '.z.ai'
  ],
};

export default nextConfig;
