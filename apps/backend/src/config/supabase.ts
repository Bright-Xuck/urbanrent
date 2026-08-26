import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERIVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL environment variable is not set");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERIVICE_ROLE_KEY environment variable is not set");
}

const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

export default supabase;
