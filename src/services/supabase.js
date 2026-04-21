import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';
import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl, warnMissingSupabaseConfig } from '../config/env';

const ExpoSecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const saveFavoriteLocal = async (favorite) => {
  if (!supabase) {
    warnMissingSupabaseConfig();
    return false;
  }

  try {
    const { error } = await supabase.from('favorites').insert([favorite]);

    if (error) {
      console.error('Erro salvando favorito no Supabase', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Erro de exce\u00E7\u00E3o ao salvar favorito', e);
    return false;
  }
};

export const getFavoritesLocal = async () => {
  if (!supabase) {
    warnMissingSupabaseConfig();
    return [];
  }

  try {
    const { data, error } = await supabase.from('favorites').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Erro buscando favoritos no Supabase', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Erro de exce\u00E7\u00E3o ao buscar favoritos', e);
    return [];
  }
};
