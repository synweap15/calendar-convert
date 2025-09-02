import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils.js';

export default function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
}) {
  const lastActiveRef = useRef(null);
  const panelRef = useRef(null);
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    lastActiveRef.current = document.activeElement;
    function onKey(e) {
      if (e.key === 'Escape' && onOpenChange) {
        onOpenChange(false);
      }
      if (e.key === 'Tab') {
        const root = panelRef.current;
        if (!root) {
          return;
        }
        const focusables = root.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) {
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    document.addEventListener('keydown', onKey);
    // focus first element
    setTimeout(() => {
      const root = panelRef.current;
      if (!root) {
        return;
      }
      const first = root.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (first && first.focus) {
        first.focus();
      }
    }, 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      const el = lastActiveRef.current;
      if (el && el.focus) {
        el.focus();
      }
    };
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/20"
        onClick={() => {
          if (onOpenChange) {
            onOpenChange(false);
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed left-1/2 top-1/2 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2',
          'rounded-md border border-slate-200 bg-white p-4 shadow-lg'
        )}
        onClick={(e) => {
          e.stopPropagation();
        }}
        ref={panelRef}
      >
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-1.5 text-xs text-slate-600">{description}</p>
        <div className="mt-3 flex items-center justify-end gap-2">
          {cancelLabel ? (
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
              onClick={() => {
                if (onOpenChange) {
                  onOpenChange(false);
                }
              }}
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) {
                onConfirm();
              }
              if (onOpenChange) {
                onOpenChange(false);
              }
            }}
            className="inline-flex items-center rounded-md bg-accent px-3 py-1 text-xs font-medium text-white hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
