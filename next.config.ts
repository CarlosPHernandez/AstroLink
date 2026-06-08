import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Phone/tablet on same Wi‑Fi hits http://<LAN-IP>:3000 — allow dev HMR/actions from that host.
  // Update the IP if your router assigns a different address (see `npm run dev` “Network” line).
  output: 'standalone',
  allowedDevOrigins: ["192.168.1.13"],
  images: supabaseHostname
    ? {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            pathname: '/storage/v1/object/public/expert-intro-videos/**',
          },
        ],
      }
    : undefined,
};

export default nextConfig;
