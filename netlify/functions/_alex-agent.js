import { Agent, OpenAIProvider, Runner, tool } from '@openai/agents';
import { z } from 'zod';
import {
  inspectNextPublishingAction,
  inspectPublishingContext,
  inspectPublishingReadiness,
  proposePublishingFieldUpdate,
} from '../../src/lib/publishingAgent.js';
import { routeAlexSpecialist } from '../../src/lib/alexRouting.js';

function jsonResult(value) {
  return JSON.stringify(value);
}

function createPublishingTools(workflowContext) {
  const inspectContext = tool({
      name: 'inspect_publishing_context',
      description: 'Read the current publishing step, active field, confirmed book facts, and remembered author decisions. Use this before answering context-dependent questions.',
      parameters: z.object({}),
      async execute() { return jsonResult(inspectPublishingContext(workflowContext)); },
    });
  const inspectReadiness = tool({
      name: 'check_publishing_readiness',
      description: 'Read the authoritative readiness blockers, missing essentials, and recommendations. Use when the author asks what is missing, whether the book is ready, or what to fix.',
      parameters: z.object({}),
      async execute() { return jsonResult(inspectPublishingReadiness(workflowContext)); },
    });
  const inspectNextAction = tool({
      name: 'get_next_publishing_action',
      description: 'Read the application-authoritative next publishing action. Use for next, continue, what now, or what should I do.',
      parameters: z.object({}),
      async execute() { return jsonResult(inspectNextPublishingAction(workflowContext)); },
    });
  const inspectPricing = tool({
      name: 'inspect_pricing_and_distribution',
      description: 'Read the author-confirmed formats, distribution decision, pricing objective, and deterministic price scenarios.',
      parameters: z.object({}),
      async execute() {
        return jsonResult({
          pricingContext: workflowContext.pricingContext || {},
          pricingCoach: workflowContext.pricingCoach || {},
        });
      },
    });
  const inspectConversion = tool({
      name: 'inspect_conversion_diagnostics',
      description: 'Read exact manuscript health-check findings, severity, impact, and repair guidance. Use this for conversion readiness, critical issues, warnings, headings, images, formatting, or file-health questions.',
      parameters: z.object({}),
      async execute() { return jsonResult(workflowContext.conversionDiagnostics || { findings: [] }); },
    });
  const proposeFieldWording = tool({
      name: 'propose_active_field_wording',
      description: 'Prepare wording for the active field for author review. This never saves or applies the value and always requires explicit author approval.',
      parameters: z.object({ field: z.string(), value: z.string(), reason: z.string().optional() }),
      async execute({ field, value, reason }) {
        return jsonResult(proposePublishingFieldUpdate(workflowContext, field, value, reason));
      },
    });

  return {
    inspectContext,
    inspectReadiness,
    inspectNextAction,
    inspectPricing,
    inspectConversion,
    proposeFieldWording,
  };
}

function createSpecialistTools(workflowContext, model) {
  const tools = createPublishingTools(workflowContext);
  const sharedRules = `
You are an internal specialist supporting Alex, the author-facing publishing coworker.
Use the supplied application tools before reaching a conclusion. Treat their results as authoritative.
Never claim that a field was changed, saved, uploaded, or approved. You provide analysis to Alex only.
Return a concise, practical briefing. State confirmed facts separately from suggestions or inferences.
Do not greet the author and do not mention that you are a specialist.`;

  const metadata = new Agent({
    name: 'Metadata specialist',
    model,
    instructions: `${sharedRules}
Focus on title, subtitle, description, audience, genres, categories, keywords, comparable positioning, and consistency between those facts. Preserve author-confirmed facts and flag missing evidence. Recommend no more than three useful improvements at once.`,
    tools: [tools.inspectContext, tools.inspectReadiness],
  });
  const conversion = new Agent({
    name: 'Conversion specialist',
    model,
    instructions: `${sharedRules}
Focus on manuscript conversion readiness. Report the exact finding, severity, publishing impact, and the clearest repair steps. Lead with critical issues, then warnings. Never imply you inspected manuscript content beyond the diagnostic data.`,
    tools: [tools.inspectContext, tools.inspectConversion],
  });
  const pricingDistribution = new Agent({
    name: 'Pricing and distribution specialist',
    model,
    instructions: `${sharedRules}
Focus on pricing objectives, formats, print cost, retailer fees, royalties, wide distribution, and exclusivity. Compare scenarios using available deterministic figures. Never guarantee sales or earnings. Remember and respect confirmed distribution choices.`,
    tools: [tools.inspectContext, tools.inspectPricing],
  });
  const readiness = new Agent({
    name: 'Publishing readiness specialist',
    model,
    instructions: `${sharedRules}
Focus on whether the project is ready and what the author should do next. Identify the single highest-priority blocker or next action, explain why it matters, and give a short completion test. Do not overwhelm the author with the entire checklist unless asked.`,
    tools: [tools.inspectContext, tools.inspectReadiness, tools.inspectNextAction],
  });

  return {
    tools,
    specialists: {
      consult_metadata_specialist: metadata.asTool({
        toolName: 'consult_metadata_specialist',
        toolDescription: 'Consult for metadata, title, subtitle, description, genre, audience, keywords, categories, comparable titles, or contradictions between book facts.',
      }),
      consult_conversion_specialist: conversion.asTool({
        toolName: 'consult_conversion_specialist',
        toolDescription: 'Consult for manuscript health, conversion readiness, headings, table of contents, images, formatting, warnings, and critical file issues.',
      }),
      consult_pricing_distribution_specialist: pricingDistribution.asTool({
        toolName: 'consult_pricing_distribution_specialist',
        toolDescription: 'Consult for prices, royalties, retailer fees, formats, distribution strategy, wide distribution, or Amazon exclusivity.',
      }),
      consult_readiness_specialist: readiness.asTool({
        toolName: 'consult_readiness_specialist',
        toolDescription: 'Consult when asked whether the book is ready, what is missing, what to fix, what comes next, or when the author says next or continue.',
      }),
    },
  };
}

export async function runAlexAgent({ messages, workflowContext, model, baseURL, apiKey, sessionId, userMessage }) {
  const [system, ...input] = messages;
  const requiredSpecialist = routeAlexSpecialist(userMessage, workflowContext);
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
  const { tools, specialists } = createSpecialistTools(workflowContext, model);
  const availableSpecialists = requiredSpecialist
    ? [specialists[requiredSpecialist]].filter(Boolean)
    : Object.values(specialists);
  const alex = new Agent({
    name: 'Alex',
    model,
    instructions: `${system?.content || 'You are Alex, a warm and capable publishing coworker.'}

You have internal publishing specialists. For substantive metadata, conversion, readiness/next-step, or pricing/distribution questions, consult the matching specialist before answering. Answer greetings and ordinary human conversation directly. When a specialist has been selected for this turn, keep the response within that topic unless the author explicitly asks about another one.
Translate specialist findings into a natural, empathetic response in your own voice. Never reveal specialist names, tools, routing, or internal briefings. Do not merely repeat a checklist: answer the author's actual question, then offer one sensible next move.
Only use propose_active_field_wording when the author asks to draft or revise an editable field. A proposal is not an applied change; the interface handles approval and application. Never say a change was saved unless the application confirms it.`,
    tools: [...availableSpecialists, tools.proposeFieldWording],
    modelSettings: requiredSpecialist ? { toolChoice: requiredSpecialist } : undefined,
  });

  try {
    const result = await runner.run(alex, input, { maxTurns: 8 });
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
