// src/config/supabase.js — Frankfurt project client (singleton)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

const supabaseUrl = (
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  extra.supabaseUrl ??
  ''
).trim();

const supabaseAnonKey = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  extra.supabaseAnonKey ??
  ''
).trim();

const isConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let client = null;

if (isConfigured) {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = client;
export const isSupabaseConfigured = isConfigured;
