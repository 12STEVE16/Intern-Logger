import { createClient } from "@supabase/supabase-js";

// Always use environment variables for safety
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single Supabase client for the whole app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
