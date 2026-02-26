-- Выполни этот скрипт в Supabase → SQL Editor → New query (если таблиц users/tower_progress ещё нет)

-- 1) Таблицы users и tower_progress
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet       TEXT UNIQUE,
  anon_session TEXT UNIQUE,
  level        INT NOT NULL DEFAULT 1,
  xp           INT NOT NULL DEFAULT 0,
  gold         INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tower_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tower_type  TEXT NOT NULL,
  level       INT NOT NULL DEFAULT 1,
  xp          INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, tower_type)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_insert_own ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

ALTER TABLE tower_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tower_progress_select_own ON tower_progress;
DROP POLICY IF EXISTS tower_progress_insert_own ON tower_progress;
DROP POLICY IF EXISTS tower_progress_update_own ON tower_progress;
DROP POLICY IF EXISTS tower_progress_delete_own ON tower_progress;
CREATE POLICY tower_progress_select_own ON tower_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tower_progress_insert_own ON tower_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tower_progress_update_own ON tower_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY tower_progress_delete_own ON tower_progress FOR DELETE USING (auth.uid() = user_id);

-- 2) Колонка last_wave
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_wave INT NOT NULL DEFAULT 0;
