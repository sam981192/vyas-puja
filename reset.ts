import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fuchqekspwkbwwvkzswr.supabase.co";
const SUPABASE_KEY = "sb_publishable_X2wkPYR29Uvf2WsPMOOr8w_4M02dLNA";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function reset() {
  console.log("Connecting to Supabase...");
  // Try to delete all rows. Use a filter that matches everything if neq doesn't work well
  // We can just filter by timestamp not being null, assuming all rows have a timestamp
  const { data, error } = await supabase.from('offerings').delete().neq('id', 'dummy_value_to_delete_all');
  
  if (error) {
    console.error("Error resetting database:", error);
  } else {
    console.log("Database reset successfully.");
  }
}

reset();
