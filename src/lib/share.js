import { REF_MONDAY_UTC } from './time.js';

// URL-safe Base64 helpers
function toBase64Url(bytes) {
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(s) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

// Encode compact binary state: [ver u8][count u8][(start u16)(len u16)]*count[tzLen u8][tz bytes]
export function encodeState(timezone, ranges) {
  const count = Math.min(ranges.length, 255);
  const tzBytes = new TextEncoder().encode(timezone);
  const total = 1 + 1 + count * 4 + 1 + tzBytes.length;
  const buf = new Uint8Array(total);
  let o = 0;
  buf[o++] = 1; // version
  buf[o++] = count & 0xff;
  for (let i = 0; i < count; i++) {
    const r = ranges[i];
    const startMin = Math.round((r.startUtc - REF_MONDAY_UTC) / 60000);
    const lenMin = Math.round((r.endUtc - r.startUtc) / 60000);
    const s = clamp16(startMin);
    const l = clamp16(lenMin);
    buf[o++] = (s >>> 8) & 0xff;
    buf[o++] = s & 0xff;
    buf[o++] = (l >>> 8) & 0xff;
    buf[o++] = l & 0xff;
  }
  buf[o++] = tzBytes.length & 0xff;
  buf.set(tzBytes, o);
  return toBase64Url(buf);
}

export function decodeState(s) {
  if (!s) {
    throw new Error('Empty state');
  }
  const buf = fromBase64Url(s);
  let o = 0;
  const ver = buf[o++];
  if (ver !== 1) {
    throw new Error('Unsupported state version');
  }
  const count = buf[o++];
  // Decoder now accepts up to 255 ranges (u8 max), matching encoder clamp
  if (count > 255) {
    throw new Error('Too many ranges');
  }
  const ranges = [];
  for (let i = 0; i < count; i++) {
    const sHi = buf[o++];
    const sLo = buf[o++];
    const lHi = buf[o++];
    const lLo = buf[o++];
    const startMin = (sHi << 8) | sLo;
    const lenMin = (lHi << 8) | lLo;
    if (startMin > 7 * 24 * 60 || lenMin <= 0 || lenMin % 30 !== 0) {
      throw new Error('Invalid range values');
    }
    const startUtc = REF_MONDAY_UTC + startMin * 60000;
    const endUtc = startUtc + lenMin * 60000;
    ranges.push({ startUtc, endUtc });
  }
  const tzLen = buf[o++];
  if (o + tzLen > buf.length) {
    throw new Error('Invalid timezone bytes');
  }
  const tz = new TextDecoder().decode(buf.slice(o, o + tzLen));
  return { timezone: tz, ranges };
}

function clamp16(n) {
  if (n < 0) {
    return 0;
  }
  if (n > 65535) {
    return 65535;
  }
  return n | 0;
}
