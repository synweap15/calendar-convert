import { useMemo, useRef, useState } from 'react';
import {
  DAYS,
  halfHourSlots,
  splitRangeByLocalDays,
  utcToLocalParts,
  tzShort,
} from '../lib/time.js';
import ConfirmDialog from './ui/ConfirmDialog.jsx';

// Interactive weekly grid: 7 columns (Mon-Sun) x 48 rows (30m). Click to select start/end.
export default function AvailabilityCalendar({
  timezone,
  timeFormat = '24',
  ranges,
  onAddRange,
  onDeleteRange,
}) {
  const [pending, setPending] = useState(null); // {dayIndex, slot}
  const [hoverSlot, setHoverSlot] = useState(null); // number | null
  const [deleteId, setDeleteId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const wrapRef = useRef(null);

  // Compute per-day availability segments from stored UTC ranges
  const daySlotMap = useMemo(() => {
    return buildDaySlotMap(ranges, timezone);
  }, [ranges, timezone]);

  function onCellClick(dayIndex, slot) {
    const hit = hitTest(dayIndex, slot, daySlotMap);
    if (hit) {
      return;
    }
    if (!pending) {
      setPending({ dayIndex, slot });
      return;
    }
    if (pending.dayIndex !== dayIndex) {
      // Force selection within a single column for simplicity
      setPending({ dayIndex, slot });
      return;
    }
    const a = Math.min(pending.slot, slot);
    const b = Math.max(pending.slot, slot);
    onAddRange(dayIndex, a, b);
    setPending(null);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-2 lg:hidden">
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={() => {
            scrollByDays(-1, wrapRef);
          }}
        >
          Prev
        </button>
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={() => {
            scrollByDays(1, wrapRef);
          }}
        >
          Next
        </button>
      </div>
      <div className="calendar-wrap">
        <div
          ref={wrapRef}
          className="calendar rounded-md"
          role="grid"
          aria-label="Weekly availability grid"
        >
          <div className="cell col-head sticky-left" />
          {DAYS.map((d) => {
            return (
              <div key={d} className="cell col-head">
                {d}
              </div>
            );
          })}

          {halfHourSlots().map((slot) => {
            return (
              <Row
                key={slot}
                slot={slot}
                timezone={timezone}
                timeFormat={timeFormat}
                daySlotMap={daySlotMap}
                pending={pending}
                hoverSlot={hoverSlot}
                onCellClick={onCellClick}
                onCellHover={setHoverSlot}
                onDeleteRange={onDeleteRange}
              />
            );
          })}
        </div>
      </div>
      <p className="badge" style={{ marginTop: 12 }}>
        Rendering in timezone: <span className="accent">{timezone}</span> (
        {tzShort(timezone, new Date())})
      </p>
      {pending && hoverSlot != null && (
        <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
          <span className="text-slate-500">Preview:</span>
          <PreviewLabel
            dayIndex={pending.dayIndex}
            a={pending.slot}
            b={hoverSlot}
            abbr={tzShort(timezone, new Date())}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete availability?"
        description="This will remove the selected time range."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (deleteId != null) {
            onDeleteRange(deleteId);
          }
          setDeleteId(null);
        }}
      />
    </div>
  );
}

function scrollByDays(delta, wrapRef) {
  const el = wrapRef.current;
  if (!el) {
    return;
  }
  const styles = getComputedStyle(document.documentElement);
  const dayCol = styles.getPropertyValue('--day-col').trim();
  let step = el.clientWidth / 2;
  if (dayCol.endsWith('px')) {
    const n = parseFloat(dayCol);
    if (!Number.isNaN(n)) {
      step = n;
    }
  }
  el.scrollBy({ left: delta * step, behavior: 'smooth' });
}

function Row({
  slot,
  timezone,
  timeFormat,
  daySlotMap,
  pending,
  hoverSlot,
  onCellClick,
  onCellHover,
  onDeleteRange,
}) {
  const label = slot % 2 === 0 ? formatSlot(slot, timeFormat) : '';
  return (
    <>
      <div className="cell row-head sticky-left">{label}</div>
      {DAYS.map((_, dayIndex) => {
        const active = daySlotMap[dayIndex]?.has(slot);
        const isPending = pending && pending.dayIndex === dayIndex && pending.slot === slot;
        const isPreview =
          pending &&
          hoverSlot != null &&
          pending.dayIndex === dayIndex &&
          slot >= Math.min(pending.slot, hoverSlot) &&
          slot <= Math.max(pending.slot, hoverSlot);
        const prevActive = daySlotMap[dayIndex]?.has(slot - 1);
        const nextActive = daySlotMap[dayIndex]?.has(slot + 1);
        const isStartOfBlock = active && !prevActive;
        const isEndOfBlock = active && !nextActive;
        const seg = isStartOfBlock ? findSegment(dayIndex, slot, daySlotMap) : null;
        const rangeLabel = seg
          ? `${toLabelHM(seg.startIdx, timeFormat)}–${toLabelHM(seg.endIdxExclusive, timeFormat)}`
          : '';
        const showLabel = isStartOfBlock && !(seg && seg.endIdxExclusive === 48);
        return (
          <button
            key={dayIndex + '_' + slot}
            className={`cell grid-btn${active ? ' active' : ''}${isStartOfBlock ? ' start' : ''}${isEndOfBlock ? ' end' : ''}${isPending ? ' pending' : ''}${isPreview && !active ? ' preview' : ''}`}
            onClick={() => {
              onCellClick(dayIndex, slot);
            }}
            onMouseEnter={() => {
              onCellHover(slot);
            }}
            aria-pressed={active}
            title={active ? 'Click to delete availability' : 'Click to start/end selection'}
          >
            {isStartOfBlock ? (
              <>
                {showLabel ? <span className="range-label">{rangeLabel}</span> : null}
                {seg ? (
                  <span
                    role="button"
                    aria-label="Delete"
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRange(seg.id);
                    }}
                  >
                    ×
                  </span>
                ) : null}
              </>
            ) : null}
          </button>
        );
      })}
    </>
  );
}

function buildDaySlotMap(ranges, tz) {
  const map = Array.from({ length: 7 }, () => {
    return new Set();
  });
  for (const r of ranges) {
    const segs = splitRangeByLocalDays(r.startUtc, r.endUtc, tz);
    for (const seg of segs) {
      const start = utcToLocalParts(new Date(seg.startMs), tz);
      const end = utcToLocalParts(new Date(seg.endMs), tz);
      const startIdx = start.hour * 2 + (start.minute >= 30 ? 1 : 0);
      // end is exclusive; include slots strictly before end
      let endIdxExclusive = end.hour * 2 + (end.minute >= 30 ? 1 : 0);
      if (end.hour === 23 && end.minute === 59) {
        endIdxExclusive = 48;
      }
      for (let s = startIdx; s < endIdxExclusive; s++) {
        map[seg.dayIndex].add(s);
      }
      // Attach id lookup for hit testing by marking map with metadata
      map[seg.dayIndex]._segments = map[seg.dayIndex]._segments || [];
      map[seg.dayIndex]._segments.push({
        id: r.id,
        startIdx,
        endIdxExclusive,
      });
    }
  }
  return map;
}

function hitTest(dayIndex, slot, daySlotMap) {
  const col = daySlotMap[dayIndex];
  if (!col || !col._segments) {
    return null;
  }
  return (
    col._segments.find((seg) => {
      return slot >= seg.startIdx && slot < seg.endIdxExclusive;
    }) || null
  );
}

function toLabelHM(slot, format = '24') {
  const capped = Math.min(slot, 48);
  let h = Math.floor(capped / 2);
  let m = capped % 2 === 0 ? 0 : 30;
  if (capped === 48) {
    h = 0;
    m = 0;
  }
  return format === '24'
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    : `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function formatSlot(slot, format = '24') {
  const h = Math.floor(slot / 2);
  const m = 0;
  return format === '24'
    ? `${String(h).padStart(2, '0')}:00`
    : `${((h + 11) % 12) + 1}:00 ${h >= 12 ? 'PM' : 'AM'}`;
}

function PreviewLabel({ dayIndex, a, b, abbr }) {
  const start = Math.min(a, b);
  const end = Math.max(a, b) + 1; // inclusive slot range -> exclusive end
  return (
    <span>
      {DAYS[dayIndex]} — {toLabelHM(start)}–{toLabelHM(end)} {abbr}
    </span>
  );
}

function findSegment(dayIndex, slot, daySlotMap) {
  const col = daySlotMap[dayIndex];
  if (!col || !col._segments) {
    return null;
  }
  return (
    col._segments.find((seg) => {
      return seg.startIdx === slot;
    }) || null
  );
}
