const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  require('sharp');
} catch {
  console.log('Instalando sharp...');
  execSync('npm install sharp --save-dev', { stdio: 'inherit' });
}

const sharp = require('sharp');

const svgPath = path.join(__dirname, '../src/assets/icon/logo.svg');
const svgBuffer = fs.readFileSync(svgPath);

const sizes = [
  { size: 72,  name: 'icon-72x72.png' },
  { size: 96,  name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

async function generateIcons() {
  const outputDir = path.join(__dirname, '../src/assets/icon');

  for (const { size, name } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, name));
    console.log(`✓ Generado: ${name} (${size}x${size})`);
  }

  console.log('\n✅ Todos los íconos generados en src/assets/icon/');
}

generateIcons().catch(console.error);
