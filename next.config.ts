import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phone/tablet on same Wi‑Fi hits http://<LAN-IP>:3000 — allow dev HMR/actions from that host.
  // Update the IP if your router assigns a different address (see `npm run dev` “Network” line).
  output: 'standalone',
  allowedDevOrigins: ["192.168.1.13"],
};

export default nextConfig;
