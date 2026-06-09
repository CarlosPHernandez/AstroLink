import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const MAX_WIDTH = {
  '.jpeg': 960,
  '.jpg': 960,
  '.png': 960,
};

async function optimizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const maxWidth = MAX_WIDTH[ext];
  if (!maxWidth) return;

  const original = await stat(filePath);
  const webpPath = filePath.replace(/\.(jpe?g|png)$/i, '.webp');
  const image = sharp(filePath);
  const metadata = await image.metadata();
  const width = metadata.width ?? maxWidth;

  await image
    .resize({ width: Math.min(width, maxWidth), withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(webpPath);

  const optimized = await stat(webpPath);
  console.log(
    `${path.basename(filePath)} → ${path.basename(webpPath)} (${Math.round(original.size / 1024)}KB → ${Math.round(optimized.size / 1024)}KB)`,
  );
}

const entries = await readdir(PUBLIC_DIR);
for (const name of entries) {
  const filePath = path.join(PUBLIC_DIR, name);
  const info = await stat(filePath);
  if (info.isFile()) {
    await optimizeFile(filePath);
  }
}
