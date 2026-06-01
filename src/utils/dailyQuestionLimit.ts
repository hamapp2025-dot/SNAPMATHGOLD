import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../config/supabase';

const STORAGE_PREFIX = '@snapmath_daily_questions_';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}:${todayKey()}`;
}

/** PDF free tier: 2 questions per day */
export const FREE_DAILY_QUESTION_LIMIT = 2;

export async function getDailyQuestionCount(userId: string): Promise<number> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('daily_question_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('usage_date', todayKey())
      .maybeSingle();

    if (!error && data && typeof data.count === 'number') {
      return data.count;
    }
  }

  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    return raw ? Number.parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function incrementDailyQuestionCount(userId: string): Promise<number> {
  const next = (await getDailyQuestionCount(userId)) + 1;

  if (isSupabaseConfigured && supabase) {
    await supabase.from('daily_question_usage').upsert(
      {
        user_id: userId,
        usage_date: todayKey(),
        count: next,
      },
      { onConflict: 'user_id,usage_date' },
    );
  }

  try {
    await AsyncStorage.setItem(storageKey(userId), String(next));
  } catch {
    // Ignore local cache failures.
  }

  return next;
}

export async function canAnswerFreeDailyQuestion(userId: string): Promise<boolean> {
  const count = await getDailyQuestionCount(userId);
  return count < FREE_DAILY_QUESTION_LIMIT;
}

export async function resetDailyQuestionCount(userId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase
      .from('daily_question_usage')
      .delete()
      .eq('user_id', userId)
      .eq('usage_date', todayKey());
  }

  try {
    await AsyncStorage.removeItem(storageKey(userId));
  } catch {
    // Ignore local cache failures.
  }
}
