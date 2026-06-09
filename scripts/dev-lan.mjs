#!/usr/bin/env node
/**
 * HTTPS dev server reachable from phones on the same Wi‑Fi.
 * Next.js prints https://0.0.0.0:3000 when bound to all interfaces — that URL
 * does not work on iPhone. We detect the LAN IP and print the URL to use.
 */
import { execSync, spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';

function getLanIp() {
  for (const iface of ['en0', 'en1']) {
    try {
      const ip = execSync(`ipconfig getifaddr ${iface}`, { encoding: 'utf8' }).trim();
      if (ip) return ip;
    } catch {
      // try next interface
    }
  }
  for (const entries of Object.values(networkInterfaces())) {
    for (const net of entries ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

const lanIp = getLanIp();
if (!lanIp) {
  console.error(
    'Could not detect your Mac LAN IP. Open System Settings → Wi‑Fi → Details and use https://<that-ip>:3000 on the phone.',
  );
  process.exit(1);
}

console.log('');
console.log('  Phone (Safari, same Wi‑Fi):  https://' + lanIp + ':3000');
console.log('  Mac (mentor):                https://localhost:3000');
console.log('  (Ignore Next.js “Network: https://0.0.0.0:3000” — use the phone URL above.)');
console.log('');

// Next.js blocks dev HMR/actions from LAN hosts unless listed in allowedDevOrigins.
const child = spawn(
  'npx',
  ['next', 'dev', '--hostname', '0.0.0.0', '--experimental-https'],
  {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, DEV_LAN_ORIGIN: lanIp },
  },
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
