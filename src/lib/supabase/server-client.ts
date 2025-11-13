import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env/server";

const defaultOptions = {
  auth: {
    persistSession: false,
  },
};

export const createServerSupabaseClient = () =>
  createClient(serverEnv.supabaseUrl, serverEnv.supabaseAnonKey, defaultOptions);

export const createServiceRoleSupabaseClient = () => {
  if (!serverEnv.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set for admin operations.");
  }

  return createClient(
    serverEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    defaultOptions
  );
};

