/**
 * Supabase Server Client (service-role key — NEVER expose to the browser)
 * Used only inside API routes and server actions. Bypasses Row Level Security.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseServerClient() {
  if (!url || !serviceKey) {
    throw new Error(
      '[Quorum] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'Configure these in .env.local before using the Supabase backend.'
    );
  }
  // Each API invocation gets a fresh client (no cross-request state leak in serverless)
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
