import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './FilterPillBar.css';

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"
      width="11" height="11" className={`filter-pill-chevron${open ? ' open' : ''}`}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

export function FilterPillBar({ children, className = '' }) {
  return <div className={`filter-pill-bar${className ? ` ${className}` : ''}`}>{children}</div>;
}

/**
 * A single rounded filter pill. Two modes:
 *  - Plain button: pass `onClick` (no `options`) — e.g. a pill that links elsewhere.
 *  - Dropdown: pass `options` (+ `value`/`onChange` for single-select,
 *    or `multi` + `value` (array) + `onToggleValue` for multi-select).
 *
 * Dropdown panels render through a portal into document.body, positioned
 * from the trigger's bounding rect. This is required because the pill row
 * scrolls horizontally (overflow-x: auto), and per the CSS overflow spec a
 * non-'visible' overflow-x forces the y-axis to clip too -- so a panel
 * absolutely positioned inside the row would be invisibly cut off.
 */
export function FilterPill({
  label, icon, active, onClick,
  options, value, onChange, multi = false, onToggleValue,
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function updatePosition() {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      const minWidth = Math.max(r.width, 200);
      const estimatedHeight = Math.min(320, (options?.length || 1) * 42 + 16);
      const opensUpward = r.bottom + 8 + estimatedHeight > window.innerHeight;
      const top = opensUpward ? Math.max(8, r.top - estimatedHeight - 8) : r.bottom + 8;
      const left = Math.max(8, Math.min(r.left, window.innerWidth - minWidth - 8));
      setCoords({ top, left, minWidth });
    }
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, options?.length]);

  useEffect(() => {
    if (!open) return undefined;
    function handler(e) {
      if (triggerRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!options) {
    return (
      <button type="button" className={`filter-pill${active ? ' filter-pill--active' : ''}`} onClick={onClick}>
        {icon}{label}
      </button>
    );
  }

  const selected = multi ? (value || []) : null;
  const selectedOpt = !multi ? options.find(o => o.value === value) : null;
  const isDefault = !multi && options[0] && value === options[0].value;

  const displayLabel = multi
    ? (selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${label} · ${selected.length}`)
    : (selectedOpt ? selectedOpt.label : label);

  const isActive = multi ? selected.length > 0 : !isDefault;

  const panel = open && coords && createPortal(
    <div
      className="filter-pill-panel"
      ref={panelRef}
      style={{ position: 'fixed', top: coords.top, left: coords.left, minWidth: coords.minWidth }}
    >
      {options.map(opt => multi ? (
        <button
          key={opt.value}
          type="button"
          className="filter-pill-option"
          onClick={() => onToggleValue(opt.value)}
        >
          <span className={`filter-pill-check${selected.includes(opt.value) ? ' checked' : ''}`} aria-hidden="true" />
          {opt.label}
        </button>
      ) : (
        <button
          key={opt.value}
          type="button"
          className={`filter-pill-option${opt.value === value ? ' active' : ''}`}
          onClick={() => { onChange(opt.value); setOpen(false); }}
        >
          {opt.label}
        </button>
      ))}
    </div>,
    document.body
  );

  return (
    <div className="filter-pill-dropdown">
      <button
        type="button"
        ref={triggerRef}
        className={`filter-pill${isActive ? ' filter-pill--active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        {icon}{displayLabel}<Chevron open={open} />
      </button>
      {panel}
    </div>
  );
}
