import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseURL = "https://nsacgpcnhqzxassfvuts.supabase.co";
const supabaseKey = "sb_publishable_h7E_Yp2W314kFCmGo4qR5g_C8ctFv8n";

const supabaseClient = createClient(supabaseURL, supabaseKey);

export default supabaseClient;