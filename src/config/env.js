const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let hasWarnedAboutMissingConfig = false;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const warnMissingSupabaseConfig = () => {
  if (!hasSupabaseConfig && !hasWarnedAboutMissingConfig) {
    console.warn('Supabase n\u00E3o configurado. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY.');
    hasWarnedAboutMissingConfig = true;
  }
};

export { supabaseAnonKey, supabaseUrl };
