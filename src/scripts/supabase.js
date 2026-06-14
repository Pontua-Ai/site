import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { SUPABASE_URL, SUPABASE_KEY } from "./supabase-config.js";

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabaseClient;