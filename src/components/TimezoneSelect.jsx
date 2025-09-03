import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { supportedTimeZones, tzShort } from '../lib/time.js';
import { cn } from '../lib/utils.js';

export default function TimezoneSelect({ value, onChange }) {
  const all = useMemo(() => {
    return supportedTimeZones();
  }, []);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [panelTop, setPanelTop] = useState(0);
  const panelRef = useRef(null);
  const btnRef = useRef(null);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) {
      return all;
    }
    return all.filter((tz) => {
      return tz.toLowerCase().includes(term);
    });
  }, [q, all]);

  // Ensure current value remains selectable if it falls out of filter
  useEffect(() => {
    if (!all.includes(value)) {
      onChange('UTC');
    }
  }, [all, value, onChange]);

  useEffect(() => {
    function onDoc(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          'inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs sm:text-sm text-slate-700 shadow-sm hover:bg-slate-50'
        )}
        ref={btnRef}
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next && btnRef.current) {
              const rect = btnRef.current.getBoundingClientRect();
              setPanelTop(Math.round(rect.bottom + window.scrollY));
            }
            return next;
          });
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-slate-500 whitespace-nowrap">🌍 Timezone:</span>
        <span className="font-medium truncate max-w-[60vw] sm:max-w-[240px]">{value}</span>
        <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
          {tzShort(value, new Date())}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="text-slate-400"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div
          ref={panelRef}
          className="fixed sm:absolute z-50 sm:mt-2 left-0 sm:left-auto sm:right-0 w-screen sm:w-80 max-w-none sm:max-w-[calc(100vw-1rem)] rounded-none sm:rounded-md border border-slate-200 bg-white p-2 shadow-lg"
          style={{ top: panelTop, right: 0 }}
        >
          <input
            autoFocus
            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Search city/timezone"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
            }}
          />
          <div className="mt-2 max-h-60 sm:max-h-80 overflow-auto">
            <ul role="listbox">
              {filtered.map((tz) => {
                return (
                  <li key={tz}>
                    <button
                      type="button"
                      className={cn(
                        'w-full text-left px-2 py-1 rounded-md text-sm hover:bg-slate-100',
                        tz === value && 'bg-slate-100 font-medium'
                      )}
                      onClick={() => {
                        onChange(tz);
                        setOpen(false);
                      }}
                      role="option"
                      aria-selected={tz === value}
                    >
                      {tz}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

TimezoneSelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
