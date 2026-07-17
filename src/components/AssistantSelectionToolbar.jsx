import { useEffect, useMemo, useRef, useState } from 'react';
import './AssistantSelectionToolbar.css';

function positionFor(bounds) {
  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth;
  const horizontalCentre = bounds.left + Math.max(bounds.width, 12) / 2;
  return {
    left: Math.min(Math.max(horizontalCentre, 82), Math.max(82, viewportWidth - 82)),
    top: bounds.top > 54 ? bounds.top - 42 : bounds.top + Math.max(bounds.height, 18) + 8,
  };
}

/** A compact, accessible control anchored to an author’s native text selection. */
export default function AssistantSelectionToolbar({ selection, onAskAlex, onClear }) {
  const [position, setPosition] = useState(null);
  const hasClearedForScroll = useRef(false);
  const selectionKey = selection ? `${selection.field}:${selection.start}:${selection.end}:${selection.sourceValue.length}` : '';

  useEffect(() => {
    if (!selection?.bounds) {
      setPosition(null);
      return undefined;
    }
    const update = () => setPosition(positionFor(selection.bounds));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [selection?.bounds, selectionKey]);

  useEffect(() => {
    if (!selection) return undefined;
    const handleEscape = event => {
      if (event.key === 'Escape') onClear?.();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClear, selection]);

  // Selection bounds are viewport-relative. Once either the page or a native
  // textarea scrolls, the saved bounds can no longer be trusted, so dismiss
  // the control rather than letting it float beside unrelated content. Capture
  // phase sees scroll events from nested scroll containers, including textareas.
  useEffect(() => {
    if (!selection) {
      hasClearedForScroll.current = false;
      return undefined;
    }

    hasClearedForScroll.current = false;
    const dismissForScroll = () => {
      if (hasClearedForScroll.current) return;
      hasClearedForScroll.current = true;
      setPosition(null);
      onClear?.();
    };

    window.addEventListener('scroll', dismissForScroll, true);
    window.visualViewport?.addEventListener('scroll', dismissForScroll);
    return () => {
      window.removeEventListener('scroll', dismissForScroll, true);
      window.visualViewport?.removeEventListener('scroll', dismissForScroll);
    };
  }, [onClear, selection, selectionKey]);

  const excerpt = useMemo(() => String(selection?.text || '').replace(/\s+/g, ' ').trim().slice(0, 64), [selection?.text]);
  if (!selection || !position) return null;

  return (
    <div className="assistant-selection-toolbar" role="toolbar" aria-label={`Selected text in ${selection.label}`} style={position}>
      <span title={selection.text}>“{excerpt}{selection.text.length > excerpt.length ? '…' : ''}”</span>
      <button
        type="button"
        onMouseDown={event => event.preventDefault()}
        onClick={() => onAskAlex?.(selection)}
      >
        <span aria-hidden="true">✦</span> Ask Alex about this
      </button>
      <button
        type="button"
        className="assistant-selection-toolbar-close"
        onMouseDown={event => event.preventDefault()}
        onClick={() => onClear?.()}
        aria-label="Clear selected text"
        title="Clear selection"
      >×</button>
    </div>
  );
}
