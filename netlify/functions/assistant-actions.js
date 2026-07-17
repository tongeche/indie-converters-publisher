import { createClient } from '@supabase/supabase-js';
import { sanitizePublishingActionPlan } from '../../src/lib/publishingPlan.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getEnv(name) {
  return globalThis.Netlify?.env?.get(name) || process.env[name];
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function authorizedClient(req) {
  const authorization = req.headers.get('authorization') || '';
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const url = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!accessToken || !url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await supabase.auth.getUser(accessToken);
  return data?.user?.id ? { supabase, userId: data.user.id } : null;
}

function serializeAction(row) {
  const args = row.tool_arguments || {};
  return {
    approvalId: row.id,
    field: args.field,
    label: args.label,
    value: args.proposedValue,
    previousValue: args.previousValue,
    status: row.status,
    appliedValue: row.run_state?.appliedValue || null,
    undone: row.run_state?.undone === true,
  };
}

export default async (req) => {
  const auth = await authorizedClient(req);
  if (!auth) return json({ error: 'Authentication required' }, 401);

  if (req.method === 'GET') {
    const draftKey = String(new URL(req.url).searchParams.get('draftKey') || '').trim().slice(0, 160);
    if (!draftKey) return json({ error: 'draftKey is required' }, 400);
    const { data: state } = await auth.supabase.from('publishing_agent_state').select('id, working_state').eq('user_id', auth.userId).eq('draft_key', draftKey).maybeSingle();
    if (!state) return json({ pending: [], lastUndoable: null, actionPlan: null });
    const { data, error } = await auth.supabase.from('publishing_agent_approvals')
      .select('id, tool_arguments, run_state, status, requested_at')
      .eq('agent_state_id', state.id)
      .eq('user_id', auth.userId)
      .order('requested_at', { ascending: false })
      .limit(30);
    if (error) return json({ error: 'Could not load Alex actions' }, 500);
    const actions = (data || []).map(serializeAction);
    return json({
      pending: actions.filter(action => action.status === 'pending' || action.status === 'approved'),
      lastUndoable: actions.find(action => action.status === 'completed' && !action.undone) || null,
      actionPlan: sanitizePublishingActionPlan(state.working_state?.actionPlan),
    });
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    if (body.action === 'save_plan') {
      const draftKey = String(body.draftKey || '').trim().slice(0, 160);
      if (!draftKey) return json({ error: 'draftKey is required' }, 400);
      const actionPlan = body.plan === null ? null : sanitizePublishingActionPlan(body.plan);
      if (body.plan !== null && !actionPlan) return json({ error: 'Invalid action plan' }, 400);
      const { data: state } = await auth.supabase.from('publishing_agent_state')
        .select('id, working_state')
        .eq('user_id', auth.userId)
        .eq('draft_key', draftKey)
        .maybeSingle();
      if (!state) return json({ error: 'Publishing agent state not found' }, 404);
      const { error } = await auth.supabase.from('publishing_agent_state').update({
        working_state: { ...(state.working_state || {}), actionPlan },
        updated_at: new Date().toISOString(),
      }).eq('id', state.id).eq('user_id', auth.userId);
      if (error) return json({ error: 'Could not save publishing plan' }, 500);
      return json({ ok: true, actionPlan });
    }
    const approvalId = String(body.approvalId || '');
    const outcome = String(body.outcome || '');
    if (!UUID_PATTERN.test(approvalId) || !['applied', 'rejected', 'failed', 'undone'].includes(outcome)) return json({ error: 'Invalid action receipt' }, 400);
    const { data: approval } = await auth.supabase.from('publishing_agent_approvals')
      .select('id, tool_arguments, run_state, status')
      .eq('id', approvalId).eq('user_id', auth.userId).maybeSingle();
    if (!approval) return json({ error: 'Action not found' }, 404);
    const now = new Date().toISOString();
    const status = outcome === 'rejected' ? 'rejected' : outcome === 'failed' ? 'failed' : 'completed';
    const runState = {
      ...(approval.run_state || {}),
      outcome,
      field: approval.tool_arguments?.field || null,
      appliedValue: outcome === 'applied' ? String(body.appliedValue || '').slice(0, 4000) : approval.run_state?.appliedValue || null,
      previousValue: body.previousValue == null ? approval.tool_arguments?.previousValue ?? null : String(body.previousValue).slice(0, 4000),
      undone: outcome === 'undone',
      receivedAt: now,
    };
    const { error } = await auth.supabase.from('publishing_agent_approvals').update({
      status,
      decided_at: approval.status === 'pending' ? now : undefined,
      completed_at: outcome === 'applied' || outcome === 'undone' ? now : null,
      run_state: runState,
      error_message: outcome === 'failed' ? String(body.error || 'Client action failed').slice(0, 500) : null,
    }).eq('id', approvalId).eq('user_id', auth.userId);
    if (error) return json({ error: 'Could not record Alex action' }, 500);
    return json({ ok: true, status, receipt: runState });
  }

  return json({ error: 'Method not allowed' }, 405);
};

export const config = { path: '/api/assistant-actions', method: ['GET', 'POST'] };
