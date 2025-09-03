import { useEffect, useMemo, useState } from 'react';
import AvailabilityCalendar from './components/AvailabilityCalendar.jsx';
import TimezoneSelect from './components/TimezoneSelect.jsx';
import {
  DAYS,
  REF_MONDAY_UTC,
  localToUtc,
  overlaps,
  utcToLocalParts,
  tzShort,
} from './lib/time.js';
import { encodeState, decodeState } from './lib/share.js';
import ConfirmDialog from './components/ui/ConfirmDialog.jsx';
import TimeFormatToggle from './components/ui/TimeFormatToggle.jsx';

const DEFAULT_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

let idCounter = 1;

export default function App() {
  const [timezone, setTimezone] = useState(DEFAULT_TZ);
  const [availabilities, setAvailabilities] = useState([]); // {id, startUtc, endUtc}
  const [invalidStateOpen, setInvalidStateOpen] = useState(false);
  const [clearAllOpen1, setClearAllOpen1] = useState(false);
  const [clearAllOpen2, setClearAllOpen2] = useState(false);
  const [overlapOpen, setOverlapOpen] = useState(false);
  const [rangeCapOpen, setRangeCapOpen] = useState(false);
  const [timeFormat, setTimeFormat] = useState('24');

  const mondayLocal = useMemo(() => {
    return utcToLocalParts(new Date(REF_MONDAY_UTC), timezone);
  }, [timezone]);
  const tzAbbr = useMemo(() => {
    return tzShort(timezone, new Date());
  }, [timezone]);

  function addRange(dayIndex, startSlot, endSlot) {
    // Prevent exceeding encoded state capacity (u8 count => max 255 ranges)
    if (availabilities.length >= 255) {
      setRangeCapOpen(true);
      return;
    }
    const startMin = startSlot * 30;
    const endMin = (endSlot + 1) * 30;
    // compute local civil date for the chosen weekday in current tz
    const y = mondayLocal.year;
    const m = mondayLocal.month;
    const d = mondayLocal.day + dayIndex;
    const startH = Math.floor(startMin / 60);
    const startM = startMin % 60;
    const endH = Math.floor(endMin / 60);
    const endM = endMin % 60;
    const startDate = localToUtc(timezone, y, m, d, startH, startM);
    const endDate = localToUtc(timezone, y, m, d, endH, endM);
    const s = startDate.getTime();
    const e = endDate.getTime();
    // Validate overlap in UTC
    if (
      availabilities.some((r) => {
        return overlaps(s, e, r.startUtc, r.endUtc);
      })
    ) {
      setOverlapOpen(true);
      return;
    }
    setAvailabilities((prev) => {
      return prev.concat({ id: idCounter++, startUtc: s, endUtc: e });
    });
  }

  function deleteRange(id) {
    setAvailabilities((prev) => {
      return prev.filter((r) => {
        return r.id !== id;
      });
    });
  }

  const listView = useMemo(() => {
    // Format list grouped by day label in current timezone
    return availabilities
      .map((r) => {
        return {
          id: r.id,
          start: utcToLocalParts(new Date(r.startUtc), timezone),
          end: utcToLocalParts(new Date(r.endUtc), timezone),
        };
      })
      .sort((a, b) => {
        // Sort by day index then start time
        const ai = dayIndexOf(a.start);
        const bi = dayIndexOf(b.start);
        return ai === bi ? a.start.hour - b.start.hour || a.start.minute - b.start.minute : ai - bi;
      });
  }, [availabilities, timezone]);

  function dayIndexOf(parts) {
    // Monday=0..Sunday=6 in the current timezone relative to REF_MONDAY_UTC
    const base = new Date(REF_MONDAY_UTC);
    const baseParts = utcToLocalParts(base, timezone);
    const baseDate = Date.UTC(baseParts.year, baseParts.month - 1, baseParts.day);
    const curDate = Date.UTC(parts.year, parts.month - 1, parts.day);
    const days = Math.floor((curDate - baseDate) / (24 * 3600 * 1000));
    return ((days % 7) + 7) % 7;
  }

  // Load state from URL on first mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('state');
      if (s) {
        const decoded = decodeState(s);
        if (decoded.timezone) {
          setTimezone(decoded.timezone);
        }
        if (Array.isArray(decoded.ranges)) {
          setAvailabilities(
            decoded.ranges.map((r) => {
              return { id: idCounter++, startUtc: r.startUtc, endUtc: r.endUtc };
            })
          );
        }
      }
    } catch (e) {
      setInvalidStateOpen(true);
    }
  }, []);

  // Update shareable URL on state change
  useEffect(() => {
    const minimal = availabilities.map((r) => {
      return { startUtc: r.startUtc, endUtc: r.endUtc };
    });
    const s = encodeState(timezone, minimal);
    const url = new URL(window.location.href);
    url.searchParams.set('state', s);
    window.history.replaceState(null, '', url.toString());
  }, [timezone, availabilities]);

  return (
    <div className="container">
      <div className="header" style={{ justifyContent: 'space-between' }}>
        <h1
          className="text-base sm:text-xl font-semibold text-slate-900 flex-1 min-w-0"
          style={{ margin: 0 }}
        >
          Availability Calendar 📅
        </h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <TimezoneSelect value={timezone} onChange={setTimezone} />
          <TimeFormatToggle value={timeFormat} onChange={setTimeFormat} />
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs sm:text-sm text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => {
              setClearAllOpen1(true);
            }}
          >
            🧹 Clear All
          </button>
        </div>
      </div>
      <p className="text-slate-600 text-xs sm:text-sm mb-3">
        🌐 Share availability for cross‑timezone collaboration — see and convert times at a glance
        so everyone views the same schedule in their local zone.
      </p>

      <AvailabilityCalendar
        timezone={timezone}
        timeFormat={timeFormat}
        ranges={availabilities}
        onAddRange={addRange}
        onDeleteRange={deleteRange}
      />

      <div style={{ marginTop: 12 }}>
        <h3
          className="text-sm sm:text-base font-semibold text-slate-900"
          style={{ margin: '8px 0' }}
        >
          Availabilities (in {timezone} · {tzAbbr})
        </h3>
        {listView.length === 0 ? (
          <p className="badge">No availabilities yet. Click two cells to add.</p>
        ) : (
          <ul className="availability-list">
            {listView.map(({ id, start, end }) => {
              return (
                <li key={id}>
                  {DAYS[dayIndexOf(start)]} — {fmt(start.hour, start.minute)}–
                  {fmt(end.hour, end.minute)} {tzAbbr}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={invalidStateOpen}
        onOpenChange={setInvalidStateOpen}
        title="Invalid or unsupported URL state"
        description="We could not load the shared calendar. Please check the link."
        confirmLabel="OK"
        cancelLabel={null}
        onConfirm={() => {
          setInvalidStateOpen(false);
        }}
      />
      <ConfirmDialog
        open={overlapOpen}
        onOpenChange={setOverlapOpen}
        title="Overlapping range"
        description="Range overlaps an existing availability. Please choose another."
        confirmLabel="OK"
        cancelLabel={null}
        onConfirm={() => {
          setOverlapOpen(false);
        }}
      />
      <ConfirmDialog
        open={rangeCapOpen}
        onOpenChange={setRangeCapOpen}
        title="Range limit reached"
        description="Range count is capped at 255. Please remove a range before adding another."
        confirmLabel="OK"
        cancelLabel={null}
        onConfirm={() => {
          setRangeCapOpen(false);
        }}
      />
      <ConfirmDialog
        open={clearAllOpen1}
        onOpenChange={setClearAllOpen1}
        title="Clear all availabilities?"
        description="This will remove every availability from the week."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={() => {
          setClearAllOpen1(false);
          setClearAllOpen2(true);
        }}
      />
      <ConfirmDialog
        open={clearAllOpen2}
        onOpenChange={setClearAllOpen2}
        title="Really remove all availabilities?"
        description="This action cannot be undone."
        confirmLabel="Delete All"
        cancelLabel="Back"
        onConfirm={() => {
          setAvailabilities([]);
          setClearAllOpen2(false);
        }}
      />

      <footer className="mt-6 mb-4 text-slate-500 text-xs sm:text-sm">
        © 2025{' '}
        <a
          href="https://dev.werda.pl"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-slate-300 hover:decoration-slate-500"
        >
          Paweł Werda
        </a>
        . Source on{' '}
        <a
          href="https://github.com/synweap15/calendar-convert"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-slate-300 hover:decoration-slate-500"
        >
          GitHub 🔗
        </a>
        .
      </footer>
    </div>
  );

  function pad(n) {
    return String(n).padStart(2, '0');
  }
  function fmt(h, m) {
    return timeFormat === '24'
      ? `${pad(h)}:${pad(m)}`
      : `${((h + 11) % 12) + 1}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
  }
}
