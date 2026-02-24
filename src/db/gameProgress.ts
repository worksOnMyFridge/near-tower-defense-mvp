/**
 * Сохранение прогресса после каждой завершённой волны.
 * Анонимный вход (Supabase Auth), затем upsert users (gold, last_wave) и tower_progress.
 */

import { supabase } from './supabase';

const STORAGE_KEY_ANON_SIGNED = 'nftd_anon_signed';

export interface TowerSnapshot {
  element: string;
  level: number;
}

/** Убедиться, что есть анонимная сессия (один раз за сессию). */
async function ensureAnonSession(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(STORAGE_KEY_ANON_SIGNED) === '1') {
      const { data: { session: s2 } } = await supabase.auth.getSession();
      if (s2?.user?.id) return s2.user.id;
    }
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('gameProgress: anon sign-in failed', error.message);
      return null;
    }
    if (data?.user?.id && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY_ANON_SIGNED, '1');
    }
    return data?.user?.id ?? null;
  } catch (e) {
    console.warn('gameProgress: ensureAnonSession', e);
    return null;
  }
}

/**
 * Сохранить прогресс после завершённой волны.
 * Вызывать после каждой очищенной волны (gold и towers — текущее состояние).
 */
export async function saveProgressAfterWave(
  gold: number,
  waveNumber: number,
  towers: TowerSnapshot[]
): Promise<void> {
  if (!supabase) return;
  const userId = await ensureAnonSession();
  if (!userId) return;

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('last_wave')
      .eq('id', userId)
      .maybeSingle();
    const lastWaveToSave = Math.max(existing?.last_wave ?? 0, waveNumber);

    const { error: userError } = await supabase
      .from('users')
      .upsert(
        {
          id: userId,
          anon_session: userId,
          gold,
          last_wave: lastWaveToSave,
        },
        { onConflict: 'id' }
      );

    if (userError) {
      console.warn('gameProgress: users upsert', userError.message);
    }

    for (const t of towers) {
      const { error: tpError } = await supabase
        .from('tower_progress')
        .upsert(
          {
            user_id: userId,
            tower_type: t.element,
            level: t.level,
            xp: 0,
          },
          { onConflict: 'user_id,tower_type' }
        );
      if (tpError) console.warn('gameProgress: tower_progress', t.element, tpError.message);
    }
  } catch (e) {
    console.warn('gameProgress: saveProgressAfterWave', e);
  }
}
