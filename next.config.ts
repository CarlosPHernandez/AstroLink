import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

/** Set automatically by `npm run dev:lan` (scripts/dev-lan.mjs). */
const devLanOrigin = process.env.DEV_LAN_ORIGIN?.trim();

const nextConfig: NextConfig = {
  // Phone/tablet on same Wi‑Fi hits https://<LAN-IP>:3000 (dev:lan) — allow dev HMR/actions from that host.
  // `dev:lan` injects DEV_LAN_ORIGIN; no manual IP edits when DHCP changes.
  output: 'standalone',
  allowedDevOrigins: devLanOrigin ? [devLanOrigin] : [],
  turbopack: {
    root: projectRoot,
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    ...(supabaseHostname
      ? {
          remotePatterns: [
            {
              protocol: 'https',
              hostname: supabaseHostname,
              pathname: '/storage/v1/object/public/expert-intro-videos/**',
            },
          ],
        }
      : {}),
  },
};

export default nextConfig;
