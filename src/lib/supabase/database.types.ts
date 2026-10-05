/**
 * Supabase Database Types — auto-aligned with the Quorum Supabase schema.
 * Mirrors the `simulation_state` table and its JSONB columns.
 */

export interface SimulationCluster {
  clusterId: number;
  ipCount: number;
  accountCount: number;
  contributingIps: string[];
  targetedAccounts: string[];
  totalEvents: number;
}

export interface SimulationGraphNode {
  id: string;
  type: 'ip' | 'user';
  label: string;
  status: 'normal' | 'spray' | 'pivot';
  degree: number;
}

export interface SimulationGraphLink {
  source: string;
  target: string;
  outcome: 'SUCCESS' | 'FAILURE';
  timestamp: string;
}

export interface SimulationStateRow {
  id: string;                         // 'demo-singleton' fixed PK
  current_score: number;              // 0–100
  severity_tier: string;              // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: string;                     // 'BASELINE' | 'SPRAY' | 'PIVOT'
  last_pivot_at: string | null;       // ISO 8601 UTC
  reasoning: string;
  clusters: SimulationCluster[];      // JSONB
  graph_nodes: SimulationGraphNode[]; // JSONB
  graph_links: SimulationGraphLink[]; // JSONB
  naive_alerts: number;
  loosened_alerts: number;
  total_events: number;
  failed_events: number;
  success_events: number;
  unique_ips: number;
  unique_users: number;
  last_pivot_user: string | null;
  last_pivot_ip: string | null;
  updated_at: string;                 // ISO 8601 UTC — triggers Realtime diff
}

// Supabase JS client generic type
export interface Database {
  public: {
    Tables: {
      simulation_state: {
        Row: SimulationStateRow;
        Insert: Partial<SimulationStateRow> & { id: string };
        Update: Partial<SimulationStateRow>;
      };
    };
  };
}
