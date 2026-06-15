import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://fuchqekspwkbwwvkzswr.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_X2wkPYR29Uvf2WsPMOOr8w_4M02dLNA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
