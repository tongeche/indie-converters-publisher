// The editor app (indie-editors, a separate deploy) shares this Supabase
// project but is a different origin — sessions here live in localStorage,
// which never crosses origins. Login.jsx hands a session to the editor's
// /auth/callback via a one-time token in the URL fragment (same convention
// Supabase's own magic-link flow uses) instead of a plain redirect.

const ALLOWED_REDIRECT_ORIGINS = [
  'https://indieconverters-editor.netlify.app',
];

/** Only trust a `redirect` param whose origin is on the allowlist — an
 * unchecked redirect target would let anyone craft a link that ships a
 * signed-in visitor's session tokens off to an arbitrary site. */
export function sanitizeRedirect(redirect) {
  if (!redirect) return null;
  try {
    const url = new URL(redirect);
    return ALLOWED_REDIRECT_ORIGINS.includes(url.origin) ? redirect : null;
  } catch {
    return null;
  }
}

/** Appends the session tokens setSession() needs as a URL fragment —
 * fragments never reach a server, unlike query params. */
export function withSessionFragment(redirect, session) {
  const url = new URL(redirect);
  url.hash = `access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`;
  return url.toString();
}
