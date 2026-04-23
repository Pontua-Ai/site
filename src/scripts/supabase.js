import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { config } from "./config.js";

const supabaseClient = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);

export default supabaseClient;