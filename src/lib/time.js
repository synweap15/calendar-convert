// Timezone helpers using Intl only (no external deps)
// We anchor the weekly schedule to a fixed Monday 00:00:00 UTC.

export const REF_MONDAY_UTC = Date.UTC(2025, 0, 6, 0, 0, 0, 0); // 2025-01-06 is a Monday

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function supportedTimeZones() {
  try {
    // Modern browsers support this API
    const list = Intl.supportedValuesOf('timeZone');
    return Array.from(list);
  } catch {
    return [
      'UTC',
      'Europe/Warsaw',
      'Europe/London',
      'America/New_York',
      'America/Los_Angeles',
      'Asia/Tokyo',
      'Asia/Singapore',
      'Australia/Sydney',
    ];
  }
}

function fmtParts(date, timeZone) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = f.formatToParts(date);
  const get = (t) => {
    return parts.find((p) => {
      return p.type === t;
    }).value;
  };
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
  };
}

function minutesSinceEpochUTC(y, m, d, h, mm, s = 0) {
  return Math.floor(Date.UTC(y, m - 1, d, h, mm, s) / 60000);
}

// Convert a local civil time in a timezone to a UTC Date via small iterative correction.
export function localToUtc(tz, y, m, d, h, mm) {
  // initial guess interpreting the civil time as if it were UTC
  let u = Date.UTC(y, m - 1, d, h, mm, 0);
  for (let i = 0; i < 3; i++) {
    const p = fmtParts(new Date(u), tz);
    // difference in minutes between actual local parts at u and desired civil time
    const want = minutesSinceEpochUTC(y, m, d, h, mm);
    const have = minutesSinceEpochUTC(p.year, p.month, p.day, p.hour, p.minute);
    const diffMin = have - want;
    if (diffMin === 0) {
      break;
    }
    u -= diffMin * 60000;
  }
  return new Date(u);
}

// Convert a UTC date to local parts in timezone
export function utcToLocalParts(dateUtc, tz) {
  return fmtParts(dateUtc, tz);
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}
export function labelHM(h, m) {
  return `${pad2(h)}:${pad2(m)}`;
}

export function minutesOfDay(h, m) {
  return h * 60 + m;
}

export function dayIndexFromParts(parts, tz) {
  // Calculate day index relative to REF_MONDAY_UTC when seen in the same timezone
  const base = new Date(REF_MONDAY_UTC);
  const baseLocal = fmtParts(base, tz); // Monday in tz
  const mondayMinutes = minutesSinceEpochUTC(baseLocal.year, baseLocal.month, baseLocal.day, 0, 0);
  const localMinutes = minutesSinceEpochUTC(parts.year, parts.month, parts.day, 0, 0);
  const deltaDays = Math.floor((localMinutes - mondayMinutes) / (60 * 24));
  return ((deltaDays % 7) + 7) % 7;
}

// Map a UTC range into day-indexed segments for rendering in tz.
export function splitRangeByLocalDays(startUtc, endUtc, tz) {
  const segments = [];
  const end = new Date(endUtc);
  let cur = new Date(startUtc);
  let guard = 0;
  while (cur < end && guard++ < 8) {
    const p = utcToLocalParts(cur, tz);
    const idx = dayIndexFromParts(p, tz);
    const endOfDayLocal = localToUtc(tz, p.year, p.month, p.day, 23, 59);
    let segEnd = Math.min(end.getTime(), endOfDayLocal.getTime());
    // Guard against non-progress due to edge-case conversions
    if (segEnd <= cur.getTime()) {
      segEnd = Math.min(end.getTime(), cur.getTime() + 60 * 60 * 1000); // add 1h fallback
    }
    segments.push({ dayIndex: idx, startMs: cur.getTime(), endMs: segEnd });
    cur = new Date(segEnd + 1000);
  }
  return segments;
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function halfHourSlots() {
  return Array.from({ length: 48 }, (_, i) => {
    return i;
  });
}

// Best-effort short timezone name (e.g., CEST, PT, GMT+2) for a given UTC date.
export function tzShort(tz, dateUtc = new Date()) {
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' });
    const parts = f.formatToParts(dateUtc);
    const name = parts.find((p) => {
      return p.type === 'timeZoneName';
    })?.value;
    return name || tz;
  } catch {
    return tz;
  }
}

export function formatTime(h, m, mode = '24') {
  if (mode === '24') {
    return `${pad2(h)}:${pad2(m)}`;
  }
  const isPM = h >= 12;
  const hh12 = ((h + 11) % 12) + 1;
  const mm = pad2(m);
  return `${hh12}:${mm} ${isPM ? 'PM' : 'AM'}`;
}
