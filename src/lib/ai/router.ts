import {
  AiProvider,
  AiRequest,
  AiResponse,
  ProviderHealth,
  TASK_ROUTING_TABLE,
  PROVIDER_MODELS,
  TASK_TOKEN_BUDGET,
} from '../../types/ai-router';

// ─────────────────────────────────────────────────────────────────────────────
// Health tracker: in-memory circuit breaker per provider
// In production, back with Redis or Upstash for multi-instance resilience.
// ─────────────────────────────────────────────────────────────────────────────
const providerHealth: Record<AiProvider, ProviderHealth> = {
  gemini: { provider: 'gemini', available: true, lastCheckedAt: new Date().toISOString(), consecutiveFailures: 0 },
  claude: { provider: 'claude', available: true, lastCheckedAt: new Date().toISOString(), consecutiveFailures: 0 },
  openai: { provider: 'openai', available: true, lastCheckedAt: new Date().toISOString(), consecutiveFailures: 0 },
};

const CIRCUIT_BREAKER_THRESHOLD = 3; // Mark provider unavailable after 3 consecutive failures
const CIRCUIT_RESET_MS = 60_000;     // Auto-reset circuit after 60 seconds

function markFailure(provider: AiProvider): void {
  const h = providerHealth[provider];
  const failures = h.consecutiveFailures + 1;
  providerHealth[provider] = {
    ...h,
    consecutiveFailures: failures,
    available: failures < CIRCUIT_BREAKER_THRESHOLD,
    lastCheckedAt: new Date().toISOString(),
  };
}

function markSuccess(provider: AiProvider): void {
  providerHealth[provider] = {
    ...providerHealth[provider],
    consecutiveFailures: 0,
    available: true,
    lastCheckedAt: new Date().toISOString(),
  };
}

function isAvailable(provider: AiProvider): boolean {
  const h = providerHealth[provider];
  if (h.available) return true;
  // Auto-reset circuit if enough time has passed
  const msSinceLastCheck = Date.now() - new Date(h.lastCheckedAt).getTime();
  if (msSinceLastCheck > CIRCUIT_RESET_MS) {
    providerHealth[provider] = { ...h, available: true, consecutiveFailures: 0 };
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider adapters — each returns a raw string from the vendor API
// ─────────────────────────────────────────────────────────────────────────────

async function callGemini(prompt: string, maxTokens: number): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server.');

  const model = PROVIDER_MODELS.gemini;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.1 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as {
    candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };
  const content: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const inputTokens: number = data?.usageMetadata?.promptTokenCount ?? 0;
  const outputTokens: number = data?.usageMetadata?.candidatesTokenCount ?? 0;
  return { content, inputTokens, outputTokens };
}

async function callClaude(prompt: string, maxTokens: number): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured on the server.');

  const model = PROVIDER_MODELS.claude;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as {
    content?: Array<{ text: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const content: string = data?.content?.[0]?.text ?? '';
  const inputTokens: number = data?.usage?.input_tokens ?? 0;
  const outputTokens: number = data?.usage?.output_tokens ?? 0;
  return { content, inputTokens, outputTokens };
}

async function callOpenAI(prompt: string, maxTokens: number): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured on the server.');

  const model = PROVIDER_MODELS.openai;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as {
    choices?: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content: string = data?.choices?.[0]?.message?.content ?? '';
  const inputTokens: number = data?.usage?.prompt_tokens ?? 0;
  const outputTokens: number = data?.usage?.completion_tokens ?? 0;
  return { content, inputTokens, outputTokens };
}

const PROVIDER_ADAPTERS: Record<
  AiProvider,
  (prompt: string, maxTokens: number) => Promise<{ content: string; inputTokens: number; outputTokens: number }>
> = {
  gemini: callGemini,
  claude: callClaude,
  openai: callOpenAI,
};

// ─────────────────────────────────────────────────────────────────────────────
// Prompt templates — deterministic, no hallucination surface for security data
// ─────────────────────────────────────────────────────────────────────────────
function buildPrompt(request: AiRequest): string {
  const { taskCategory, payload } = request;

  switch (taskCategory) {
    case 'INCIDENT_NARRATIVE':
      return `You are a senior SOC analyst writing a terse, precise incident brief. No marketing language.
      
Incident title: ${payload.title}
Severity: ${payload.severityTier} (${payload.severityScore}/100)
Severity equation: ${payload.severityEquation}
Contributing IPs: ${JSON.stringify(payload.contributingIps)}
Targeted accounts: ${payload.targetedAccountsCount} accounts
Compromised accounts: ${JSON.stringify(payload.compromisedAccounts)}

Write a 3-5 sentence technical incident brief for a SOC analyst. Include the attack vector, affected scope, and immediate containment recommendation. No bullet points. No headers. Plain prose only.`;

    case 'TRIAGE_SUGGESTION':
      return `You are a threat intelligence analyst. Given this incident, provide the 3 most important next actions.

Incident: ${payload.title}
Severity: ${payload.severityTier}
Compromised accounts: ${JSON.stringify(payload.compromisedAccounts)}
Contributing IPs: ${(payload.contributingIps as string[]).slice(0, 5).join(', ')}

Return exactly 3 numbered action items. Be specific. No generic advice.`;

    case 'CAMPAIGN_SUMMARY':
      return `Summarize this distributed password spray campaign for a CISO briefing in 2 sentences max.
      
Campaign cluster: ${payload.ipCount} IPs targeted ${payload.accountCount} accounts across ${payload.windowHours}h window.
Pivot confirmed: ${payload.pivotConfirmed ? 'YES - account compromise detected' : 'NO - campaign detected pre-breach'}.`;

    case 'SUPPRESSION_REASON':
      return `Explain in one technical sentence why the following signal was suppressed by a tuning rule.

Signal: ${payload.signalId}
Suppression rule: ${payload.ruleDescription}
Entity: ${payload.entityKey}`;

    case 'KQL_TRANSLATION':
      return `Translate this Quorum detection logic into a Microsoft Sentinel KQL query. 

Detection description: ${payload.detectionDescription}
Time window: ${payload.windowHours} hours
Threshold: ${payload.threshold}

Output ONLY the raw KQL query. No explanation. No markdown. Start with the KQL keyword (let, SigninLogs, etc.).`;

    default:
      return `Respond to this security context: ${JSON.stringify(payload)}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Router — tries providers in priority order with circuit breaker
// ─────────────────────────────────────────────────────────────────────────────
export async function routeAiRequest(request: AiRequest): Promise<AiResponse> {
  const providers = TASK_ROUTING_TABLE[request.taskCategory];
  const maxTokens = request.maxOutputTokens ?? TASK_TOKEN_BUDGET[request.taskCategory];
  const prompt = buildPrompt(request);

  const errors: string[] = [];

  for (const provider of providers) {
    if (!isAvailable(provider)) {
      errors.push(`${provider}: circuit open (too many recent failures)`);
      continue;
    }

    const adapter = PROVIDER_ADAPTERS[provider];
    const start = Date.now();

    try {
      const result = await adapter(prompt, maxTokens);
      markSuccess(provider);

      return {
        provider,
        model: PROVIDER_MODELS[provider],
        content: result.content,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs: Date.now() - start,
        cached: false,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${provider}: ${message}`);
      markFailure(provider);
      // Continue to next provider in priority list
    }
  }

  throw new Error(
    `All AI providers failed for task "${request.taskCategory}". Errors: ${errors.join(' | ')}`
  );
}

/**
 * Returns current health status of all providers.
 * Use for monitoring dashboard or admin panels only.
 */
export function getProviderHealthStatus(): ProviderHealth[] {
  return Object.values(providerHealth);
}
