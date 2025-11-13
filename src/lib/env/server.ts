type ServerEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
};

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL must be set.");
}

if (!supabaseAnonKey) {
  throw new Error(
    "SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
  );
}

export const serverEnv: ServerEnv = {
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceRoleKey,
};

