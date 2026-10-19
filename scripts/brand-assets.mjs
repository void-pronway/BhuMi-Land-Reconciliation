// Mechanical web-asset exports from the supplied original; artwork is unchanged.
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
const original = "public/brand/bhumi-logo.png";
const symbol = await sharp(original)
  .extract({ left: 310, top: 140, width: 640, height: 640 })
  .resize(256, 256)
  .png()
  .toBuffer();
await writeFile("public/brand/bhumi-symbol.png", symbol);
await sharp(symbol)
  .resize(180, 180)
  .png()
  .toFile("public/brand/apple-touch-icon.png");
await sharp(symbol).resize(32, 32).png().toFile("public/brand/favicon-32.png");
const icons = await Promise.all(
  [16, 32, 48].map((size) => sharp(symbol).resize(size, size).png().toBuffer()),
);
const header = Buffer.alloc(6 + icons.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icons.length, 4);
let offset = header.length;
icons.forEach((data, i) => {
  const pos = 6 + i * 16,
    size = [16, 32, 48][i];
  header[pos] = header[pos + 1] = size;
  header.writeUInt16LE(1, pos + 4);
  header.writeUInt16LE(32, pos + 6);
  header.writeUInt32LE(data.length, pos + 8);
  header.writeUInt32LE(offset, pos + 12);
  offset += data.length;
});
await writeFile("public/favicon.ico", Buffer.concat([header, ...icons]));
