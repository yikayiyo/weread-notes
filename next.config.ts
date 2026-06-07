import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js"],
  images: {
    // VPN/TUN (e.g. Clash) resolves weread CDNs to 198.18.x.x; allow in dev only.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      { protocol: "https", hostname: "cdn.weread.qq.com" },
      { protocol: "https", hostname: "res.weread.qq.com" },
      { protocol: "https", hostname: "weread-1258476243.file.myqcloud.com" },
      { protocol: "https", hostname: "wfqqreader-1252317822.image.myqcloud.com" },
    ],
  },
};

export default nextConfig;
