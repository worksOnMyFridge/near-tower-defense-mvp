/**
 * Клиент Supabase. RLS обязателен на всех таблицах.
 * Для anon-игры: Supabase Auth anonymous sign-in, затем users.id = auth.uid().
 * @see docs/TZ.md раздел 5
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as ReturnType<typeof createClient> | null);

export type UserRow = {
  id: string;
  wallet: string | null;
  anon_session: string | null;
  level: number;
  xp: number;
  gold: number;
  last_wave: number;
  created_at: string;
  deleted_at: string | null;
};

export type TowerProgressRow = {
  id: string;
  user_id: string;
  tower_type: string;
  level: number;
  xp: number;
};
