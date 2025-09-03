/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { encodeState } from '../src/lib/share.js';
import { REF_MONDAY_UTC, supportedTimeZones } from '../src/lib/time.js';

// Conservative maximum full URL length used by many apps/browsers.
// IE historically around 2000; modern browsers allow more, but 2000 is safe.
const MAX_URL_LENGTH = 2000;

function buildWorstCaseRanges(count = 100) {
  // Build `count` non-overlapping 30-minute ranges starting from REF_MONDAY_UTC.
  // Values themselves don't affect encoded size (fixed 4 bytes per range),
  // but we keep them sensible and aligned to app constraints.
  const ranges = [];
  const stepMs = 30 * 60 * 1000; // 30 minutes
  for (let i = 0; i < count; i++) {
    const startUtc = REF_MONDAY_UTC + i * stepMs;
    const endUtc = startUtc + stepMs;
    ranges.push({ startUtc, endUtc });
  }
  return ranges;
}

function longestSupportedTimezoneFallback() {
  // Try to pick the longest actual IANA timezone name available in the runtime.
  try {
    const zones = supportedTimeZones();
    let longest = zones[0] || 'UTC';
    for (const z of zones) {
      if (String(z).length > longest.length) {
        longest = String(z);
      }
    }
    return longest;
  } catch {
    // Fallback to a known long IANA ID if list isn't available
    return 'America/Argentina/ComodRivadavia';
  }
}

describe('state URL length (worst-case)', () => {
  it('does not exceed MAX_URL_LENGTH for worst-case encoded state', () => {
    // Absolute worst-case encoded size is capped by encoder at 255 ranges,
    // even if the UI could create more (48 slots x 7 days = 336).
    const totalSlotsWeek = 48 * 7; // 336
    const encoderCap = 255;
    const count = Math.min(totalSlotsWeek, encoderCap);
    const ranges = buildWorstCaseRanges(count);
    const tz = longestSupportedTimezoneFallback();

    const state = encodeState(tz, ranges);
    // Full URL length with just the `state` param in query string.
    const url = `https://example.com/?state=${state}`;

    expect(url.length).toBeLessThanOrEqual(MAX_URL_LENGTH);
  });

  it('also stays under limit for max decodable state (100 ranges)', () => {
    const ranges = buildWorstCaseRanges(100); // decoder hard limit
    const tz = longestSupportedTimezoneFallback();
    const state = encodeState(tz, ranges);
    const url = `https://example.com/?state=${state}`;
    expect(url.length).toBeLessThanOrEqual(MAX_URL_LENGTH);
  });
});
