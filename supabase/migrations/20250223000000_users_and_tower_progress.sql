-- NFTower Defense: пользователи и прогресс башен
-- RLS обязателен. Soft delete через deleted_at.

-- Пользователи
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet       TEXT UNIQUE,
  anon_session TEXT UNIQUE,
  level        INT NOT NULL DEFAULT 1,
  xp           INT NOT NULL DEFAULT 0,
  gold         INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

-- Прокачка башен (сохраняется между сессиями)
CREATE TABLE tower_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tower_type  TEXT NOT NULL,
  level       INT NOT NULL DEFAULT 1,
  xp          INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, tower_type)
);

-- RLS: users — привязка к Supabase Auth (anon или wallet). id = auth.uid() при создании.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_insert_own ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

-- RLS: tower_progress — только свой прогресс
ALTER TABLE tower_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY tower_progress_select_own ON tower_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tower_progress_insert_own ON tower_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tower_progress_update_own ON tower_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY tower_progress_delete_own ON tower_progress FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE users IS 'Игроки: wallet (NEAR) или anon_session (localStorage UUID)';
COMMENT ON TABLE tower_progress IS 'Уровень и XP башен по типам (FIRE, ICE, ...)';
