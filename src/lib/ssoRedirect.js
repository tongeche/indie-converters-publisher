// The editor app (indie-editors, a separate deploy) shares this Supabase
// project but is a different origin — sessions here live in localStorage,
// which never crosses origins. Login.jsx hands a session to the editor's
// /auth/callback via a one-time token in the URL fragment (same convention
// Supabase's own magic-link flow uses) instead of a plain redirect.

const ALLOWED_REDIRECT_ORIGINS = [
  'https://indieconverters-editor.netlify.app',
];

// The editor's /login now derives its own callback origin from the
// incoming request's Host header (see sso.ts's getAppOrigin in that repo),
// so it correctly sends back http://localhost:<port> while developing
// instead of always hard-coding production. Allowing any localhost/127.0.0.1
// origin here is safe specifically because it can only ever resolve on the
// same machine the browser is running on — it's not something an attacker
// could redirect a real visitor's session tokens to.
function isLocalDevOrigin(origin) {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

/** Only trust a `redirect` param whose origin is on the allowlist (or is a
 * local dev origin) — an unchecked redirect target would let anyone craft a
 * link that ships a signed-in visitor's session tokens off to an arbitrary
 * site. */
export function sanitizeRedirect(redirect) {
  if (!redirect) return null;
  try {
    const url = new URL(redirect);
    return ALLOWED_REDIRECT_ORIGINS.includes(url.origin) || isLocalDevOrigin(url.origin) ? redirect : null;
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
