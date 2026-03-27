// Koristi client-side supabase (sync, null-safe)
import { getSupabase as getClient } from './supabase-client';

// API route koristi ovu funkciju — sync, null-safe
export function getSupabase() {
  return getClient();
}

export { getSupabase as supabase, getSupabase as supabaseAdmin };
