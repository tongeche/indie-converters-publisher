import { createClient } from '@supabase/supabase-js';

const TOPICS = new Set([
  'publishing',
  'book_discovery',
  'account',
  'hiring',
  'technical',
  'other',
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function clean(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function getEnv(name) {
  return globalThis.Netlify?.env?.get(name) || process.env[name];
}

async function hashFingerprint(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export default async (req, context) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > 16_000) return json({ error: 'Request is too large' }, 413);

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  // Quietly absorb obvious bot submissions without creating a support item.
  if (clean(payload?.verification, 200)) return json({ ok: true }, 202);

  const formStartedAt = Number(payload?.formStartedAt || 0);
  if (!formStartedAt || Date.now() - formStartedAt < 800) {
    return json({ error: 'Please review the form and try again' }, 400);
  }

  const contactName = clean(payload?.contactName, 100) || null;
  const contactEmail = clean(payload?.contactEmail, 254).toLowerCase();
  const topic = clean(payload?.topic, 40);
  const message = clean(payload?.message, 1000);
  const pageUrl = clean(payload?.pageUrl, 500) || null;
  const visitorId = clean(payload?.visitorId, 128) || null;
  const requestedSessionId = clean(payload?.sessionId, 64);

  if (!EMAIL_PATTERN.test(contactEmail)) return json({ error: 'Enter a valid email address' }, 400);
  if (!TOPICS.has(topic)) return json({ error: 'Choose a support topic' }, 400);
  if (message.length < 10) return json({ error: 'Tell us a little more so the team can help' }, 400);
  if (payload?.consentAccepted !== true) return json({ error: 'Please accept the privacy notice' }, 400);

  const consentAcceptedAt = new Date().toISOString();

  const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[support-request] missing Supabase server environment variables');
    return json({ error: 'Human support is temporarily unavailable' }, 503);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let verifiedUserId = null;
  const authorization = req.headers.get('authorization') || '';
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (accessToken) {
    const { data } = await supabase.auth.getUser(accessToken);
    verifiedUserId = data?.user?.id || null;
  }

  const fingerprintSalt = getEnv('SUPPORT_REQUEST_HASH_SECRET') || serviceRoleKey;
  const requestFingerprint = await hashFingerprint(`${fingerprintSalt}:${context?.ip || 'unknown'}`);

  let assistantSessionId = null;
  if (UUID_PATTERN.test(requestedSessionId)) {
    const { data: session, error: sessionError } = await supabase
      .from('assistant_sessions')
      .select('id, user_id, visitor_id')
      .eq('id', requestedSessionId)
      .maybeSingle();

    if (sessionError) console.error('[support-request] session lookup failed:', sessionError.code || 'unknown');
    const userOwnsSession = verifiedUserId && session?.user_id === verifiedUserId;
    const visitorMatchesSession = !verifiedUserId && visitorId && session?.visitor_id === visitorId;
    if (userOwnsSession || visitorMatchesSession) assistantSessionId = session.id;
  }

  const { data, error } = await supabase
    .rpc('submit_assistant_handoff', {
      p_assistant_session_id: assistantSessionId,
      p_user_id: verifiedUserId,
      p_visitor_id: verifiedUserId ? null : visitorId,
      p_contact_name: contactName,
      p_contact_email: contactEmail,
      p_topic: topic,
      p_message: message,
      p_page_url: pageUrl,
      p_consent_accepted_at: consentAcceptedAt,
      p_request_fingerprint: requestFingerprint,
    });

  if (error) {
    if (error.code === 'P0001' || error.message?.includes('support_rate_limited')) {
      return json({ error: 'Too many requests. Please try again later.' }, 429);
    }
    console.error('[support-request] insert failed:', error.code || 'unknown');
    return json({ error: 'We could not save your request. Please try again.' }, 500);
  }

  return json({ ok: true, requestId: data }, 201);
};

export const config = {
  path: '/api/support-request',
  method: ['POST'],
};
