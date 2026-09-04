/**
 * Rasterises the gymtracker mark to PNG and ICO from a single geometry
 * definition, so the SVG and the bitmap icons can never drift apart.
 *
 * No image library is used. PNG chunks are written directly and the pixel
 * grid is supersampled 4x in each axis for edge antialiasing.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

/** The mark, expressed on a 32 unit grid. Mirrors public/favicon.svg. */
const GRID = 32;
const SHAPES = [
  { x: 0, y: 0, w: 32, h: 32, r: 7, color: '#16150F' },
  { x: 4, y: 17, w: 6, h: 10, r: 1.5, color: '#E2857A' },
  { x: 13, y: 11, w: 6, h: 16, r: 1.5, color: '#E0A63C' },
  { x: 22, y: 5, w: 6, h: 22, r: 1.5, color: '#5FB89B' },
];

const SAMPLES = 4;

function parseHex(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Inside test for an axis-aligned rounded rectangle. */
function insideRoundedRect(px, py, { x, y, w, h, r }) {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function renderRGBA(size) {
  const scale = size / GRID;
  const buf = new Uint8Array(size * size * 4);

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      // Straight-alpha accumulation, one shape at a time, painter's order.
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (const shape of SHAPES) {
        let hits = 0;
        for (let sy = 0; sy < SAMPLES; sy += 1) {
          for (let sx = 0; sx < SAMPLES; sx += 1) {
            const ux = (px + (sx + 0.5) / SAMPLES) / scale;
            const uy = (py + (sy + 0.5) / SAMPLES) / scale;
            if (insideRoundedRect(ux, uy, shape)) hits += 1;
          }
        }
        if (hits === 0) continue;
        const cov = hits / (SAMPLES * SAMPLES);
        const [sr, sg, sb] = parseHex(shape.color);
        r = sr * cov + r * (1 - cov);
        g = sg * cov + g * (1 - cov);
        b = sb * cov + b * (1 - cov);
        a = cov + a * (1 - cov);
      }

      const i = (py * size + px) * 4;
      buf[i] = Math.round(r);
      buf[i + 1] = Math.round(g);
      buf[i + 2] = Math.round(b);
      buf[i + 3] = Math.round(a * 255);
    }
  }
  return buf;
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // filter type: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** ICO container holding PNG-compressed entries. */
function encodeICO(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = header.length + dir.length;
  entries.forEach((entry, i) => {
    const base = i * 16;
    dir[base] = entry.size >= 256 ? 0 : entry.size;
    dir[base + 1] = entry.size >= 256 ? 0 : entry.size;
    dir[base + 2] = 0; // palette size
    dir[base + 3] = 0;
    dir.writeUInt16LE(1, base + 4); // colour planes
    dir.writeUInt16LE(32, base + 6); // bits per pixel
    dir.writeUInt32BE(0, base + 8);
    dir.writeUInt32LE(entry.png.length, base + 8);
    dir.writeUInt32LE(offset, base + 12);
    offset += entry.png.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.png)]);
}

mkdirSync(OUT_DIR, { recursive: true });

const written = [];
for (const size of [32, 180, 192, 512]) {
  const png = encodePNG(size, renderRGBA(size));
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  writeFileSync(join(OUT_DIR, name), png);
  written.push(`${name} (${png.length} bytes)`);
}

const ico = encodeICO(
  [16, 32, 48].map((size) => ({ size, png: encodePNG(size, renderRGBA(size)) })),
);
writeFileSync(join(OUT_DIR, 'favicon.ico'), ico);
written.push(`favicon.ico (${ico.length} bytes)`);

console.log(written.join('\n'));
