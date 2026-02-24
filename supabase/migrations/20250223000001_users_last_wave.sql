-- Добавляем last_wave для сохранения прогресса после каждой волны
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_wave INT NOT NULL DEFAULT 0;
COMMENT ON COLUMN users.last_wave IS 'Максимальная волна, которую игрок завершил (для сохранения прогресса)';
