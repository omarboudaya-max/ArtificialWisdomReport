export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const isSupabaseConfigured = () => !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
export const isAdminConfigured = () => isSupabaseConfigured() && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
