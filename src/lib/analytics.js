// Thin wrapper around the Plausible script loaded in index.html.
// Safe no-op if the script hasn't loaded (dev, adblockers) — never throws,
// never blocks navigation for the CTA it's attached to.
export function trackEvent(name, props) {
  if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
    window.plausible(name, props ? { props } : undefined);
  }
}
