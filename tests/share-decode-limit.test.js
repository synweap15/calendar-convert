/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { encodeState, decodeState } from '../src/lib/share.js';
import { REF_MONDAY_UTC } from '../src/lib/time.js';

function makeRanges(n) {
  const res = [];
  const step = 30 * 60 * 1000; // 30 minutes
  for (let i = 0; i < n; i++) {
    const s = REF_MONDAY_UTC + i * step;
    res.push({ startUtc: s, endUtc: s + step });
  }
  return res;
}

describe('decodeState limit', () => {
  it('decodes up to 255 ranges (matches encoder clamp)', () => {
    const ranges = makeRanges(255);
    const s = encodeState('UTC', ranges);
    const decoded = decodeState(s);
    expect(decoded.ranges.length).toBe(255);
    // sanity: first/last
    expect(decoded.ranges[0].endUtc - decoded.ranges[0].startUtc).toBe(30 * 60 * 1000);
    expect(decoded.ranges[254].endUtc - decoded.ranges[254].startUtc).toBe(30 * 60 * 1000);
  });
});
