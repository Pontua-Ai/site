import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseURL = "https://nsacgpcnhqzxassfvuts.supabase.co";
const supabaseKey = "sb_publishable_h7E_Yp2W314kFCmGo4qR5g_C8ctFv8n";

const supabase = createClient(supabaseURL, supabaseKey);

export async function signup(email, password, name, confirmPassword) {
    try {
        const {data, error} = await supabase.auth.signUp({email, password, options: {data: {name, confirmPassword}}});
        if (error) throw new Error(error.message);
        return {success: true, user: data.user};
    }
    catch (error) {
        return {success: false, error: error.message};
    }
}


export async function login(email, password) {
    try {
        const {data, error} = await supabase.auth.signInWithPassword({email, password});
        if (error) throw new Error(error.message);
        return {success: true, user: data.user};
    }
    catch (error) {
        return {success: false, error: error.message};
    }
}