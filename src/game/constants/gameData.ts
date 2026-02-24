/**
 * NFTower Defense — единственный источник всех игровых чисел.
 * Все числовые параметры живут здесь. Не дублировать в коде или документах.
 * @see docs/TZ.md раздел 3
 */

export const GAME_DATA = {
  // ── Синергии ──────────────────────────────────────────────────────────
  SYNERGY: {
    CHECK_RADIUS: 3, // клетки — радиус проверки синергий
    CHECK_INTERVAL_MS: 500, // мс — как часто проверяем активные синергии

    THERMOSHOCK: {
      AOE_MULTIPLIER: 2.5,
      AOE_RADIUS: 3,
      COOLDOWN_SEC: 8,
    },
    ELECTROSHOCK: {
      DAMAGE_MULTIPLIER: 3.0,
      CHAIN_TARGETS: 4,
      CHAIN_MULTIPLIER: 1.5,
    },
    BURNING_BLOOD: {
      EXPLOSION_PERCENT_OF_MAX_HP: 1.5,
      EXPLOSION_RADIUS: 2,
    },
    ECLIPSE: {
      ARMOR_REDUCTION: 1.0, // 1.0 = 100%
      DURATION_SEC: 5,
      DAMAGE_MULTIPLIER: 2.5,
    },
    BALL_LIGHTNING: {
      MAX_PULL_ENEMIES: 8,
      PULL_RADIUS: 2,
      DAMAGE_PER_EXTRA_ENEMY: 1.8,
    },
    NECROSIS: {
      POISON_SPEED_MULTIPLIER: 2.0,
      REGEN_REDUCTION: 0.8, // 0.8 = -80%
    },
    SOLAR_WIND: {
      ALLY_DAMAGE_BONUS: 0.25, // 0.25 = +25%
    },
    TOXIC_VORTEX: {
      ZONE_SIZE: 5, // 5×5 клеток
      DAMAGE_PER_SEC_MULTIPLIER: 1.5,
      COOLDOWN_SEC: 20,
    },
    DARK_STORM: {
      FREEZE_DURATION_SEC: 4,
      FROZEN_DAMAGE_MULTIPLIER: 5.0,
      CHAIN_TARGETS: 6,
      COOLDOWN_SEC: 15,
    },
    PLASMA: {
      DAMAGE_MULTIPLIER: 5.0,
      COOLDOWN_SEC: 10,
    },
    BLACK_PLAGUE: {
      INFECTION_SPREAD_TARGETS: 3,
    },
    ANTI: {
      LIGHTNING_POISON_PENALTY: 0.7, // теряют 70% эффективности
      FIRE_ICE_CLOSE_PENALTY: 0.3,
      LIGHT_DARK_WRONG_ORDER_PENALTY: 0.2,
    },
    POSITIONAL: {
      ELEVATION_RANGE_BONUS: 0.25,
      ELEMENT_RESONANCE_BONUS: 0.15, // за каждую доп. башню того же элемента рядом
      ELEMENT_RESONANCE_MAX_STACK: 3,
    },
  },

  // ── NFT редкость → статы ──────────────────────────────────────────────
  NFT_RARITY: {
    COMMON: { damage_mult: 1.0, range_mult: 1.0, max_level: 3, skills: 0 },
    RARE: { damage_mult: 1.2, range_mult: 1.2, max_level: 3, skills: 0 },
    EPIC: { damage_mult: 1.4, range_mult: 1.0, max_level: 3, skills: 1 },
    LEGENDARY: { damage_mult: 1.6, range_mult: 1.1, max_level: 4, skills: 2 },
  },

  // ── Артефакты ─────────────────────────────────────────────────────────
  ARTIFACTS: {
    DROP_CHANCE: {
      COMMON: 0.1,
      RARE: 0.07,
      EPIC: 0.03,
      LEGENDARY: 0.01,
    },
    MINT_COST_NEAR: 0.01, // газ при автоминтинге
    ROYALTY_PERCENT: 0.05, // 5% с вторичных продаж
    // Конкретные эффекты артефактов — расширяй здесь при добавлении
  },

  // ── Карта (Tiled: 20×15; TILE_SIZE — логическая, TILE_SIZE_PX — отображение под 1280×720) ─
  MAP: {
    GRID_COLS: 20,
    GRID_ROWS: 15,
    TILE_SIZE: 64,
    TILE_SIZE_PX: 48,
    OFFSET_X: 160,
  },

  // ── Башни: дальность в пикселях (должна доставать от любого ряда до пути по центру, ~336px) ─
  TOWER: {
    RANGE_PX: 380,
    DAMAGE: 25,
    FIRE_RATE_MS: 800,
    MAX_LEVEL: 3,
  },

  // ── Экономика ─────────────────────────────────────────────────────────
  ECONOMY: {
    TOWER_BASE_COST: 100,
    UPGRADE_COST_MULTIPLIER: 1.5, // каждый уровень × 1.5; стоимость апгрейда L→L+1 = TOWER_BASE_COST * (mult^L)
    ENEMY_KILL_GOLD_BASE: 10,
    WAVE_CLEAR_BONUS: 50,
  },

  // ── Волны и победа ─────────────────────────────────────────────────────
  WAVES: {
    WIN_AT_WAVE: 10, // дефолт (один уровень)
    /** Биом Лес: 8 уровней. Победа на уровне = завершить волну winAtWave. */
    FOREST_LEVELS: 8,
    /** Волна победы по уровням Леса (индекс 0 = уровень 1). */
    WIN_AT_WAVE_BY_LEVEL: [3, 5, 7, 10, 13, 16, 20, 25],
  },

  // ── Враги: базовые статы и масштабирование ─────────────────────────────
  ENEMY_BASE: {
    INFANTRY: { hp: 100, speed: 60, reward: 10 },
    ARMORED: { hp: 200, speed: 40, reward: 15 },
    FAST: { hp: 60, speed: 120, reward: 12 },
    FLYING: { hp: 80, speed: 90, reward: 14 },
    INVISIBLE: { hp: 70, speed: 70, reward: 18 },
    BOSS: { hp: 800, speed: 35, reward: 100 },
  },
  ENEMY_SCALING: {
    HP_PER_WAVE: 0.05, // +5% HP за каждую волну
    BOSS_HP_MULTIPLIER: 1.5, // босс получает +50% к масштабированию HP
  },

  // ── Монетизация ───────────────────────────────────────────────────────
  MONETIZATION: {
    BATTLE_PASS_PRICE_USD: 7,
    SKIN_PRICE_MIN_USD: 1,
    SKIN_PRICE_MAX_USD: 3,
    STARTER_PACK_PRICE_USD: 5,
    COLLECTION_INTEGRATION_FEE_USD_MIN: 200,
    COLLECTION_INTEGRATION_FEE_USD_MAX: 500,
    PREMIUM_DECK_SLOTS_PRICE_USD: 3, // в месяц
  },
} as const;
