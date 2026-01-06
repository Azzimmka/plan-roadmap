import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');

const svgBuffer = readFileSync(join(publicDir, 'favicon.svg'));

async function generateIcons() {
  // PWA icons
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // Apple touch icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Favicon ICO (48x48)
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(join(publicDir, 'favicon.ico'));
  console.log('Created favicon.ico');

  // Mask icon (Safari pinned tab) - keep as SVG but monochrome
  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <g fill="none" stroke="#000" stroke-width="32" stroke-linecap="round" stroke-linejoin="round">
    <path d="M128 384 L192 256 L256 320 L320 192 L384 128"/>
    <circle cx="128" cy="384" r="20" fill="#000"/>
    <circle cx="192" cy="256" r="20" fill="#000"/>
    <circle cx="256" cy="320" r="20" fill="#000"/>
    <circle cx="320" cy="192" r="20" fill="#000"/>
    <circle cx="384" cy="128" r="20" fill="#000"/>
  </g>
</svg>`;
  writeFileSync(join(publicDir, 'mask-icon.svg'), maskSvg);
  console.log('Created mask-icon.svg');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
