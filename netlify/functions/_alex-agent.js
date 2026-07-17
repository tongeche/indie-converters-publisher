import { Agent, OpenAIProvider, Runner, tool } from '@openai/agents';
import { z } from 'zod';
import {
  inspectNextPublishingAction,
  inspectPublishingContext,
  inspectPublishingReadiness,
  proposePublishingFieldUpdate,
} from '../../src/lib/publishingAgent.js';

function jsonResult(value) {
  return JSON.stringify(value);
}

function createPublishingTools(workflowContext) {
  return [
    tool({
      name: 'inspect_publishing_context',
      description: 'Read the current publishing step, active field, confirmed book facts, and remembered author decisions. Use this before answering context-dependent questions.',
      parameters: z.object({}),
      async execute() { return jsonResult(inspectPublishingContext(workflowContext)); },
    }),
    tool({
      name: 'check_publishing_readiness',
      description: 'Read the authoritative readiness blockers, missing essentials, and recommendations. Use when the author asks what is missing, whether the book is ready, or what to fix.',
      parameters: z.object({}),
      async execute() { return jsonResult(inspectPublishingReadiness(workflowContext)); },
    }),
    tool({
      name: 'get_next_publishing_action',
      description: 'Read the application-authoritative next publishing action. Use for next, continue, what now, or what should I do.',
      parameters: z.object({}),
      async execute() { return jsonResult(inspectNextPublishingAction(workflowContext)); },
    }),
    tool({
      name: 'inspect_pricing_and_distribution',
      description: 'Read the author-confirmed formats, distribution decision, pricing objective, and deterministic price scenarios.',
      parameters: z.object({}),
      async execute() {
        return jsonResult({
          pricingContext: workflowContext.pricingContext || {},
          pricingCoach: workflowContext.pricingCoach || {},
        });
      },
    }),
    tool({
      name: 'propose_active_field_wording',
      description: 'Prepare wording for the active field for author review. This never saves or applies the value and always requires explicit author approval.',
      parameters: z.object({ field: z.string(), value: z.string(), reason: z.string().optional() }),
      async execute({ field, value, reason }) {
        return jsonResult(proposePublishingFieldUpdate(workflowContext, field, value, reason));
      },
    }),
  ];
}

export async function runAlexAgent({ messages, workflowContext, model, baseURL, apiKey, sessionId }) {
  const [system, ...input] = messages;
  const provider = new OpenAIProvider({
    apiKey: apiKey || 'netlify-ai-gateway',
    baseURL: baseURL || undefined,
    useResponses: false,
  });
  const runner = new Runner({
    modelProvider: provider,
    tracingDisabled: !apiKey,
    traceIncludeSensitiveData: false,
    workflowName: 'Alex publishing coworker',
    groupId: sessionId || undefined,
  });
  const alex = new Agent({
    name: 'Alex',
    model,
    instructions: system?.content || 'You are Alex, a warm and capable publishing coworker.',
    tools: createPublishingTools(workflowContext),
  });

  try {
    const result = await runner.run(alex, input, { maxTurns: 6 });
    return {
      content: typeof result.finalOutput === 'string' ? result.finalOutput : JSON.stringify(result.finalOutput),
      agent: result.lastAgent?.name || 'Alex',
      toolCalls: result.newItems?.filter(item => item.type === 'tool_call_item').map(item => item.rawItem?.name).filter(Boolean) || [],
      lastResponseId: result.lastResponseId || null,
    };
  } finally {
    await provider.close();
  }
}
