// Pure Node.js PNG icon generator (No external dependencies, ESM)
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createPng(width, height) {
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Rounded squircle background
      const nx = Math.abs(x - cx) / (width * 0.46);
      const ny = Math.abs(y - cy) / (height * 0.46);
      const inBox = Math.pow(nx, 4) + Math.pow(ny, 4) <= 1.0;

      if (inBox) {
        // Gradient from cyan (6, 182, 212) to blue (37, 99, 235)
        const t = (x + y) / (width + height);
        let r = Math.round(6 * (1 - t) + 37 * t);
        let g = Math.round(182 * (1 - t) + 99 * t);
        let b = Math.round(212 * (1 - t) + 235 * t);

        // Lightning bolt shape
        const lx = (x - cx) / (width * 0.35);
        const ly = (y - cy) / (height * 0.35);
        const inBolt = (
          (ly > -0.7 && ly < 0.1 && lx > -0.3 + (ly * 0.3) && lx < 0.3 + (ly * 0.3)) ||
          (ly >= 0.0 && ly < 0.8 && lx > -0.5 + (ly * 0.4) && lx < 0.1 + (ly * 0.4))
        );

        if (inBolt) {
          // Dark lightning bolt
          rawData[pixelOffset] = 10;     // R
          rawData[pixelOffset + 1] = 14; // G
          rawData[pixelOffset + 2] = 24; // B
          rawData[pixelOffset + 3] = 255;
        } else {
          rawData[pixelOffset] = r;
          rawData[pixelOffset + 1] = g;
          rawData[pixelOffset + 2] = b;
          rawData[pixelOffset + 3] = 255;
        }
      } else {
        // Transparent
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // CRC32 implementation
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const typeAndData = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve(__dirname, '../public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

[16, 32, 48, 128].forEach(size => {
  const pngBuf = createPng(size, size);
  const target = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(target, pngBuf);
  console.log(`Generated icon: ${target} (${size}x${size})`);
});

