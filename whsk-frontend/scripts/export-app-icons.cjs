const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.argv[2] || 'sharp');

async function main() {
  const directory = path.join(__dirname, '../public');
  const source = await fs.readFile(path.join(directory, 'game-mark.svg'));
  await fs.mkdir(path.join(directory, 'icons'), { recursive: true });
  const render = size => sharp(source, { density: 1600 }).resize(size, size).png().toBuffer();
  for (const size of [16, 32, 180, 192, 512]) {
    await fs.writeFile(path.join(directory, `icons/game-${size}.png`), await render(size));
  }
  // ICO stores PNG images at native tab sizes for browsers requesting /favicon.ico.
  const sizes = [16, 32, 48];
  const images = await Promise.all(sizes.map(render));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    header[entry] = sizes[index];
    header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += image.length;
  });
  await fs.writeFile(path.join(directory, 'favicon.ico'), Buffer.concat([header, ...images]));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
