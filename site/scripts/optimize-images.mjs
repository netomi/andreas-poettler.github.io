// One-off: shrink oversized originals in public/img in place (max 1600px wide).
import sharp from 'sharp';
import { readdir, writeFile } from 'node:fs/promises';

const dir = new URL('../public/img/', import.meta.url);
for (const f of await readdir(dir)) {
  if (!/\.(jpe?g|png)$/i.test(f)) continue;
  const path = new URL(f, dir);
  const img = sharp(path.pathname);
  const { width } = await img.metadata();
  if (!width || width <= 1600) continue;
  const resized = img.resize({ width: 1600 });
  const buf = /\.png$/i.test(f) ? await resized.png({ compressionLevel: 9 }).toBuffer() : await resized.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  await writeFile(path, buf);
  console.log('resized', f);
}
