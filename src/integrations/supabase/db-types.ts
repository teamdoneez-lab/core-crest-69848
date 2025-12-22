// Type helper for Supabase queries when types are out of sync
// This provides type safety bypass for tables that exist in DB but not in generated types

import { supabase } from './client';

// Helper to get typed query builder that bypasses strict type checking
export const getTable = (tableName: string) => {
  return (supabase as any).from(tableName);
};

// Helper for RPC calls
export const callRpc = (fnName: string, params?: Record<string, any>) => {
  return (supabase as any).rpc(fnName, params);
};
