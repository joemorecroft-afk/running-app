// Rasterizes public/icons/source-icon.svg into the PNG sizes the PWA manifest and Strava's
// app-icon upload need. Re-run if the source SVG changes.
// Usage: node scripts/generate-icons.mjs

import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "..", "public", "icons");
const svg = readFileSync(path.join(iconsDir, "source-icon.svg"));

async function render(size, filename) {
  await sharp(svg).resize(size, size).png().toFile(path.join(iconsDir, filename));
  console.log(`Wrote ${filename} (${size}x${size})`);
}

await render(192, "icon-192.png");
await render(512, "icon-512.png");
await render(512, "icon-512-maskable.png");
await render(180, "apple-touch-icon.png");

console.log("Done.");
