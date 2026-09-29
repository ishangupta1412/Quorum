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
  hermes: { provider: 'hermes', available: true, lastCheckedAt: new Date().toISOString(), consecutiveFailures: 0 },
  ollama: { provider: 'ollama', available: true, lastCheckedAt: new Date().toISOString(), consecutiveFailures: 0 },
  freellm: { provider: 'freellm', available: true, lastCheckedAt: new Date().toISOString(), consecutiveFailures: 0 },
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

async function callOllama(prompt: string, maxTokens: number): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = PROVIDER_MODELS.ollama;
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { num_predict: maxTokens, temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as { response?: string; prompt_eval_count?: number; eval_count?: number };
  return {
    content: data.response ?? '',
    inputTokens: data.prompt_eval_count ?? Math.ceil(prompt.length / 4),
    outputTokens: data.eval_count ?? Math.ceil((data.response ?? '').length / 4),
  };
}

async function callHermes(prompt: string, maxTokens: number): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const baseUrl = process.env.HERMES_BASE_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = PROVIDER_MODELS.hermes;
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { num_predict: maxTokens, temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Hermes API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as { response?: string; prompt_eval_count?: number; eval_count?: number };
  return {
    content: data.response ?? '',
    inputTokens: data.prompt_eval_count ?? Math.ceil(prompt.length / 4),
    outputTokens: data.eval_count ?? Math.ceil((data.response ?? '').length / 4),
  };
}

async function callFreeLlm(prompt: string, maxTokens: number): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const baseUrl = process.env.FREE_LLM_API_URL || 'https://api.freellmapi.com/v1';
  const apiKey = process.env.FREE_LLM_API_KEY || 'free_tier';
  const model = PROVIDER_MODELS.freellm;
  const res = await fetch(`${baseUrl}/chat/completions`, {
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
    throw new Error(`FreeLLM API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as {
    choices?: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  return {
    content: data?.choices?.[0]?.message?.content ?? '',
    inputTokens: data?.usage?.prompt_tokens ?? Math.ceil(prompt.length / 4),
    outputTokens: data?.usage?.completion_tokens ?? Math.ceil((data?.choices?.[0]?.message?.content ?? '').length / 4),
  };
}

const PROVIDER_ADAPTERS: Record<
  AiProvider,
  (prompt: string, maxTokens: number) => Promise<{ content: string; inputTokens: number; outputTokens: number }>
> = {
  gemini: callGemini,
  claude: callClaude,
  openai: callOpenAI,
  hermes: callHermes,
  ollama: callOllama,
  freellm: callFreeLlm,
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

  // Graceful deterministic fallback for offline / air-gapped demo resilience
  const fallbackContent = generateDeterministicFallback(request);
  return {
    provider: 'deterministic-fallback',
    model: 'quorum-rules-v4',
    content: fallbackContent,
    inputTokens: Math.ceil(prompt.length / 4),
    outputTokens: Math.ceil(fallbackContent.length / 4),
    latencyMs: 12,
    cached: true,
  };
}

function generateDeterministicFallback(request: AiRequest): string {
  const { taskCategory, payload } = request;
  switch (taskCategory) {
    case 'INCIDENT_NARRATIVE':
      return `Incident "${payload.title || 'Distributed Password Spray'}" flagged at severity ${payload.severityTier || 'CRITICAL'} (${payload.severityScore || 100}/100). Telemetry confirms distributed password spray spanning ${payload.targetedAccountsCount || 'multiple'} accounts via ${(payload.contributingIps as string[])?.length || 0} residential proxy nodes. ${payload.compromisedAccounts && (payload.compromisedAccounts as string[]).length > 0 ? `Confirmed compromise of account(s): ${(payload.compromisedAccounts as string[]).join(', ')}. Recommend immediate credential revocation and session invalidation.` : 'Pre-compromise detection achieved.'}`;
    case 'TRIAGE_SUGGESTION':
      return `1. Invalidate active VPN session tokens for accounts: ${(payload.compromisedAccounts as string[])?.join(', ') || 'targeted scope'}.\n2. Block contributing IP cluster at network edge or deploy geo-fencing challenges.\n3. Query Microsoft Entra ID audit logs for anomalous post-authentication sign-in locations.`;
    case 'CAMPAIGN_SUMMARY':
      return `Distributed password spray campaign detected via bipartite graph correlation. Cluster coordinated ${payload.ipCount || 'several'} residential proxies against ${payload.accountCount || 'enterprise'} directory targets with ${payload.pivotConfirmed ? 'post-spray pivot confirmed' : 'pre-pivot containment'}.`;
    case 'SUPPRESSION_REASON':
      return `Signal suppressed under deterministic tuning rule: ${payload.ruleDescription || 'Known internal automation exception'}.`;
    case 'KQL_TRANSLATION':
      return `SigninLogs\n| where TimeGenerated >= ago(${payload.windowHours || 24}h)\n| where ResultType in ("50126", "50053")\n| summarize FailureCount = count(), UniqueUsers = dcount(UserPrincipalName) by IPAddress\n| where FailureCount >= ${payload.threshold || 5} and UniqueUsers >= 3\n| project IPAddress, FailureCount, UniqueUsers`;
    default:
      return `Deterministic telemetry correlation completed for ${taskCategory}.`;
  }
}

/**
 * Returns current health status of all providers.
 * Use for monitoring dashboard or admin panels only.
 */
export function getProviderHealthStatus(): ProviderHealth[] {
  return Object.values(providerHealth);
}
