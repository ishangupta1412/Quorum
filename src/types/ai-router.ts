// AI Provider & Task Routing Types for Quorum
// All AI calls are strictly server-side. Never expose API keys to the browser.

export type AiProvider = 'gemini' | 'claude' | 'openai';

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
  readonly provider: AiProvider;
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
  // High-reasoning: route to Claude Sonnet first, Gemini Flash as fallback
  INCIDENT_NARRATIVE: ['claude', 'gemini', 'openai'],
  TRIAGE_SUGGESTION: ['claude', 'gemini', 'openai'],

  // Low-latency bulk: Gemini Flash first, Claude as fallback
  CAMPAIGN_SUMMARY: ['gemini', 'claude', 'openai'],
  SUPPRESSION_REASON: ['gemini', 'claude', 'openai'],

  // Translation tasks: OpenAI o1-mini excels, Gemini Pro fallback
  KQL_TRANSLATION: ['openai', 'gemini', 'claude'],
};

// Model selection per provider
export const PROVIDER_MODELS: Record<AiProvider, string> = {
  gemini: 'gemini-2.0-flash',
  claude: 'claude-sonnet-4-5',
  openai: 'gpt-4o-mini',
};

// Token budget per task category (output tokens)
export const TASK_TOKEN_BUDGET: Record<AiTaskCategory, number> = {
  INCIDENT_NARRATIVE: 512,
  TRIAGE_SUGGESTION: 256,
  CAMPAIGN_SUMMARY: 384,
  SUPPRESSION_REASON: 192,
  KQL_TRANSLATION: 768,
};
