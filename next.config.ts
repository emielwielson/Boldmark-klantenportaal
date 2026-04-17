import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev server + HMR when opening the app from another host on your LAN
  // (e.g. phone at http://192.168.x.x:3000). Add your machine’s LAN IP if the
  // terminal warns about blocked cross-origin requests to /_next/webpack-hmr.
  allowedDevOrigins: ["192.168.129.5"],
};

export default nextConfig;
