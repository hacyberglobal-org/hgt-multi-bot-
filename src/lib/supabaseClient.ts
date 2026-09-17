/**
 * Supabase Client Integration for HACYBERGLOBATECH Support & Lead System
 * Lazy-initialized to prevent runtime crashes when credentials are not yet supplied.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export interface LeadSubmission {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  platform?: string;
  paymentMethod?: string;
  txHashOrProof?: string;
  notes?: string;
  status?: 'pending' | 'verified' | 'rejected';
  createdAt?: string;
}

export interface SupportTicketSubmission {
  id?: string;
  leadEmail: string;
  subject: string;
  priority: 'low' | 'normal' | 'urgent';
  details: string;
  status?: 'open' | 'in_review' | 'resolved';
  createdAt?: string;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  // In Node/server environment
  const supabaseUrl = process.env.SUPABASE_URL || (typeof window !== 'undefined' ? (window as any).__SUPABASE_URL__ : '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || (typeof window !== 'undefined' ? (window as any).__SUPABASE_ANON_KEY__ : '');

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    return supabaseClient;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  urlConfigured: boolean;
  keyConfigured: boolean;
  status: string;
}> {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    return {
      connected: false,
      urlConfigured: Boolean(url),
      keyConfigured: Boolean(key),
      status: 'UNCONFIGURED_FALLBACK_ACTIVE'
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      urlConfigured: true,
      keyConfigured: true,
      status: 'INIT_ERROR'
    };
  }

  try {
    // Attempt a light ping or schema inspection
    const { error } = await client.from('leads').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "leads" does not exist')) {
      return {
        connected: false,
        urlConfigured: true,
        keyConfigured: true,
        status: `ERROR: ${error.message}`
      };
    }
    return {
      connected: true,
      urlConfigured: true,
      keyConfigured: true,
      status: 'CONNECTED_READY'
    };
  } catch (e: any) {
    return {
      connected: false,
      urlConfigured: true,
      keyConfigured: true,
      status: `CONN_FAILED: ${e.message || 'Unknown'}`
    };
  }
}
