// AI Provider & Task Routing Types for Quorum
// All AI calls are strictly server-side. Never expose API keys to the browser.

export type AiProvider = 'gemini' | 'claude' | 'openai' | 'hermes' | 'ollama' | 'freellm';

export type AiTaskCategory =
  | 'INCIDENT_NARRATIVE'     // Describe a correlated incident in analyst language
  | 'TRIAGE_SUGGESTION'      // Suggest next actions for an open incident
  | 'CAMPAIGN_SUMMARY'       // Summarize the bipartite spray campaign in plain English
  | 'SUPPRESSION_REASON'     // Explain why a signal was suppressed
  | 'KQL_TRANSLATION';       // Translate Quorum detection logic to KQL for Sentinel

export interface AiRequest {
  readonly taskCategory: AiTaskCategory;
  readonly payload: Record<string, unknown>;
  readonly maxOutputTokens?: number;
}

export interface AiResponse {
  readonly provider: AiProvider | 'deterministic-fallback';
  readonly model: string;
  readonly content: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly latencyMs: number;
  readonly cached: boolean;
}

export interface ProviderHealth {
  readonly provider: AiProvider;
  readonly available: boolean;
  readonly lastCheckedAt: string;
  readonly consecutiveFailures: number;
}

// Task-to-provider routing table (order = priority)
export const TASK_ROUTING_TABLE: Record<AiTaskCategory, AiProvider[]> = {
  // High-reasoning: route to Claude Sonnet first, Hermes / Gemini as fallback
  INCIDENT_NARRATIVE: ['claude', 'gemini', 'hermes', 'openai', 'ollama'],
  TRIAGE_SUGGESTION: ['claude', 'gemini', 'hermes', 'openai', 'ollama'],

  // Low-latency bulk & Token Preservation: Gemini Flash first, FreeLLM / Ollama fallback
  CAMPAIGN_SUMMARY: ['gemini', 'freellm', 'claude', 'ollama', 'openai'],
  SUPPRESSION_REASON: ['gemini', 'freellm', 'claude', 'ollama', 'openai'],

  // Translation tasks: OpenAI / Claude / Gemini / Ollama
  KQL_TRANSLATION: ['openai', 'claude', 'gemini', 'freellm', 'ollama'],
};

// Model selection per provider
export const PROVIDER_MODELS: Record<AiProvider, string> = {
  gemini: 'gemini-2.0-flash',
  claude: 'claude-3-5-sonnet-20241022',
  openai: 'gpt-4o-mini',
  hermes: 'hermes-3-llama-3.1-8b',
  ollama: 'qwen2.5-coder:7b',
  freellm: 'deepseek-v3',
};

// Token budget per task category (output tokens)
export const TASK_TOKEN_BUDGET: Record<AiTaskCategory, number> = {
  INCIDENT_NARRATIVE: 512,
  TRIAGE_SUGGESTION: 256,
  CAMPAIGN_SUMMARY: 384,
  SUPPRESSION_REASON: 192,
  KQL_TRANSLATION: 768,
};
