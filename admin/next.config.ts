import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.tunisianet.com.tn" },
      { protocol: "https", hostname: "**.mytek.tn" },
      { protocol: "https", hostname: "**.jumia.com.tn" },
      { protocol: "https", hostname: "**.wiki.tn" },
      { protocol: "https", hostname: "**.nanim.com.tn" },
    ],
  },
};

export default nextConfig;
