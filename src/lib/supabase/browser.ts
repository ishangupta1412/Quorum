/**
 * Supabase Browser Client (anon key — safe to expose to the client)
 * Used only for Real-time subscriptions. Never call RLS-bypassing operations here.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Fail loudly during development if env vars are missing
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[Quorum] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
        'Real-time subscriptions will be unavailable.'
    );
  }
}

// Singleton — reuse the same client across all browser renders
declare global {
  // eslint-disable-next-line no-var
  var __quorumSupabaseBrowser: ReturnType<typeof createClient<Database>> | undefined;
}

export function getSupabaseBrowserClient() {
  if (!url || !anon) return null;
  if (typeof window === 'undefined') return null; // SSR guard

  if (!globalThis.__quorumSupabaseBrowser) {
    globalThis.__quorumSupabaseBrowser = createClient<Database>(url, anon, {
      realtime: {
        params: { eventsPerSecond: 20 },
      },
      auth: { persistSession: false },
    });
  }
  return globalThis.__quorumSupabaseBrowser;
}
