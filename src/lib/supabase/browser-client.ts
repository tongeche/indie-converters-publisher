"use client";

import { createClient } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env/client";

export const createBrowserSupabaseClient = () =>
  createClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey);

