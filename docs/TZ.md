# 📐 ТЗ — Техническое задание
# NFTower Defense

> Этот файл отвечает на вопрос "КАК это построено".
> Геймдизайн, логика синергий и баланс — в `PROJECT_BIBLE.md`.
> Загружай этот файл только когда задача касается: архитектуры, БД, интерфейсов TypeScript, инфраструктуры.

**Версия:** 2.0

---

## 1. Стек технологий

### Фронтенд / Игра
| Технология | Версия | Назначение |
|---|---|---|
| TypeScript | 5.x | Основной язык |
| Phaser.js | 3.60+ | Игровой движок |
| Vite | 5.x | Сборщик / dev-сервер |
| Tiled Map Editor | 1.10+ | Редактор карт (формат JSON) |

### Backend / Данные
| Технология | Версия | Назначение |
|---|---|---|
| Supabase | — | PostgreSQL БД, Auth |
| near-api-js | 3.x | Чтение NFT из NEAR кошелька (read-only в Фазах 1–2) |
| Colyseus.js | 0.15+ | Реалтайм PvP сервер (только Фаза 3) |

### Инфраструктура
| Сервис | Назначение | Стоимость |
|---|---|---|
| Vercel | Хостинг фронтенда | Бесплатно (Hobby tier) |
| Supabase | БД + Auth | Бесплатно (до 500MB / 50K req/day) |
| Railway.app | Colyseus сервер | ~$5/мес (только Фаза 3) |
| HotCraft.art | NFT-минтинг артефактов | 5% роялти с вторичных продаж |

---

## 2. Архитектура проекта

```
nftower-defense/
├── src/
│   ├── game/
│   │   ├── constants/
│   │   │   └── gameData.ts        # ← ЕДИНСТВЕННЫЙ ИСТОЧНИК ВСЕХ ЦИФР
│   │   ├── scenes/                # Phaser сцены
│   │   │   ├── BootScene.ts
│   │   │   ├── MenuScene.ts
│   │   │   ├── GameScene.ts
│   │   │   └── UIScene.ts
│   │   ├── entities/
│   │   │   ├── towers/
│   │   │   │   ├── BaseTower.ts
│   │   │   │   └── [Element]Tower.ts  # FireTower, IceTower, etc.
│   │   │   ├── enemies/
│   │   │   │   ├── BaseEnemy.ts
│   │   │   │   └── [Type]Enemy.ts
│   │   │   └── projectiles/
│   │   ├── systems/
│   │   │   ├── SynergySystem.ts   # ← ЯДРО, не трогать без review
│   │   │   ├── WaveSystem.ts
│   │   │   ├── EconomySystem.ts
│   │   │   └── ArtifactSystem.ts  # Фаза 3
│   │   └── maps/                  # Tiled JSON карты
│   ├── web3/
│   │   ├── NearWallet.ts
│   │   └── NFTParser.ts
│   ├── db/
│   │   └── supabase.ts
│   └── ui/
│       └── components/
├── public/
│   └── assets/
│       ├── towers/
│       ├── enemies/
│       └── maps/
├── supabase/
│   └── migrations/                # SQL миграции — обязательны при изменении схемы
└── docs/
    ├── PROJECT_BIBLE.md
    ├── AGENT_PROTOCOL.md
    ├── CHANGELOG.md
    ├── TASKS.md
    └── TZ.md
```

---

## 3. `gameData.ts` — единственный источник цифр

Все числовые параметры игры живут в одном файле. Это предотвращает рассинхронизацию между документами и кодом.

```typescript
// src/game/constants/gameData.ts

export const GAME_DATA = {

  // ── Синергии ──────────────────────────────────────────────────────────
  SYNERGY: {
    CHECK_RADIUS: 3,          // клетки — радиус проверки синергий
    CHECK_INTERVAL_MS: 500,   // мс — как часто проверяем активные синергии

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
      ARMOR_REDUCTION: 1.0,    // 1.0 = 100%
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
      REGEN_REDUCTION: 0.8,    // 0.8 = -80%
    },
    SOLAR_WIND: {
      ALLY_DAMAGE_BONUS: 0.25, // 0.25 = +25%
    },
    TOXIC_VORTEX: {
      ZONE_SIZE: 5,            // 5×5 клеток
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
      LIGHTNING_POISON_PENALTY: 0.70,  // теряют 70% эффективности
      FIRE_ICE_CLOSE_PENALTY: 0.30,
      LIGHT_DARK_WRONG_ORDER_PENALTY: 0.20,
    },
    POSITIONAL: {
      ELEVATION_RANGE_BONUS: 0.25,
      ELEMENT_RESONANCE_BONUS: 0.15,   // за каждую доп. башню того же элемента рядом
      ELEMENT_RESONANCE_MAX_STACK: 3,
    },
  },

  // ── NFT редкость → статы ──────────────────────────────────────────────
  NFT_RARITY: {
    COMMON:    { damage_mult: 1.0, range_mult: 1.0, max_level: 3, skills: 0 },
    RARE:      { damage_mult: 1.2, range_mult: 1.2, max_level: 3, skills: 0 },
    EPIC:      { damage_mult: 1.4, range_mult: 1.0, max_level: 3, skills: 1 },
    LEGENDARY: { damage_mult: 1.6, range_mult: 1.1, max_level: 4, skills: 2 },
  },

  // ── Артефакты ─────────────────────────────────────────────────────────
  ARTIFACTS: {
    DROP_CHANCE: {
      COMMON:    0.10,
      RARE:      0.07,
      EPIC:      0.03,
      LEGENDARY: 0.01,
    },
    MINT_COST_NEAR: 0.01,  // газ при автоминтинге
    ROYALTY_PERCENT: 0.05, // 5% с вторичных продаж
    // Конкретные эффекты артефактов — расширяй здесь при добавлении
  },

  // ── Экономика ─────────────────────────────────────────────────────────
  ECONOMY: {
    TOWER_BASE_COST: 100,
    UPGRADE_COST_MULTIPLIER: 1.5,  // каждый уровень × 1.5
    ENEMY_KILL_GOLD_BASE: 10,
    WAVE_CLEAR_BONUS: 50,
  },

  // ── Враги — масштабирование ───────────────────────────────────────────
  ENEMY_SCALING: {
    HP_PER_WAVE: 0.05,   // +5% HP за каждую волну
  },

  // ── Монетизация ───────────────────────────────────────────────────────
  MONETIZATION: {
    BATTLE_PASS_PRICE_USD: 7,
    SKIN_PRICE_MIN_USD: 1,
    SKIN_PRICE_MAX_USD: 3,
    STARTER_PACK_PRICE_USD: 5,
    COLLECTION_INTEGRATION_FEE_USD_MIN: 200,
    COLLECTION_INTEGRATION_FEE_USD_MAX: 500,
    PREMIUM_DECK_SLOTS_PRICE_USD: 3,  // в месяц
  },
};
```

> **Правило:** хочешь изменить цифру — меняй только здесь. Документы на цифры не ссылаются — только на `gameData.ts`.

---

## 4. TypeScript интерфейсы

```typescript
// src/game/types/index.ts

export type Element = 'FIRE' | 'ICE' | 'LIGHTNING' | 'POISON' |
                      'DARK' | 'LIGHT' | 'WIND' | 'NONE';

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type TargetPriority = 'FIRST' | 'LAST' | 'STRONGEST' | 'WEAKEST' | 'NEAREST';

export type EnemyType = 'INFANTRY' | 'ARMORED' | 'FAST' | 'FLYING' |
                        'INVISIBLE' | 'REGENERATOR' | 'UNDEAD' | 'ELITE' | 'BOSS';

export type SynergyType =
  | 'THERMOSHOCK' | 'ELECTROSHOCK' | 'BURNING_BLOOD' | 'ECLIPSE'
  | 'BALL_LIGHTNING' | 'NECROSIS' | 'SOLAR_WIND'
  | 'TOXIC_VORTEX' | 'DARK_STORM' | 'PLASMA' | 'BLACK_PLAGUE';

export interface Tower {
  id: string;
  element: Element;
  level: number;                    // 1–3, NFT Legendary: 1–4
  position: { x: number; y: number };
  targetPriority: TargetPriority;
  isNFT: boolean;
  nftData?: NFTData;
  artifact?: Artifact;              // Фаза 3
}

export interface NFTData {
  tokenId: string;
  contractId: string;
  rarity: Rarity;
  collectionName: string;
  element: Element;
  skills: string[];
}

export interface Enemy {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  immunities: Element[];
  reward: number;
  statusEffects: StatusEffect[];
}

export interface StatusEffect {
  type: 'SLOW' | 'POISON' | 'BURN' | 'FREEZE' | 'ARMOR_BREAK';
  value: number;
  duration: number;
  source: SynergyType | null;
}

export interface SynergyEffect {
  type: SynergyType;
  towers: Tower[];
  isActive: boolean;
  cooldownRemaining: number;
}

export interface Artifact {
  id: string;
  nftId: string;
  type: 'SYNERGY_MOD' | 'BEHAVIOR_MOD' | 'MAP_KEY';
  rarity: Rarity;
  equippedTowerId: string | null;
}
```

---

## 5. Схема базы данных (Supabase)

```sql
-- Пользователи
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet       TEXT UNIQUE,          -- NEAR wallet address (nullable для anon)
  anon_session TEXT UNIQUE,          -- localStorage UUID для игры без кошелька
  level        INT NOT NULL DEFAULT 1,
  xp           INT NOT NULL DEFAULT 0,
  gold         INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  deleted_at   TIMESTAMPTZ           -- soft delete
);

-- Прокачка башен (сохраняется между сессиями)
CREATE TABLE tower_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  tower_type  TEXT NOT NULL,         -- 'FIRE' | 'ICE' | etc.
  level       INT NOT NULL DEFAULT 1,
  xp          INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, tower_type)
);

-- Книга синергий
CREATE TABLE synergy_book (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  synergy_id   TEXT NOT NULL,        -- SynergyType
  discovered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, synergy_id)
);

-- Лидерборд
CREATE TABLE leaderboard (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  map_id        TEXT NOT NULL,
  score         INT NOT NULL,
  wave_reached  INT NOT NULL,
  towers_config JSONB,               -- снапшот расстановки для PvP Фазы 2
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Артефакты (Фаза 3)
CREATE TABLE artifacts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id           TEXT NOT NULL,
  nft_contract     TEXT NOT NULL,
  owner_wallet     TEXT NOT NULL,
  artifact_type    TEXT NOT NULL,    -- 'SYNERGY_MOD' | 'BEHAVIOR_MOD' | 'MAP_KEY'
  rarity           TEXT NOT NULL,
  equipped_to      UUID REFERENCES tower_progress(id),
  minted_at        TIMESTAMPTZ DEFAULT now(),
  burned_at        TIMESTAMPTZ       -- для MAP_KEY при использовании
);
```

**Правила:**
- Row Level Security обязателен на всех таблицах
- Никогда не удалять записи физически — только `deleted_at` / `burned_at`
- Любое изменение схемы = новый файл `supabase/migrations/YYYYMMDD_description.sql`

---

## 6. Ключевые системы — описание интерфейсов

### SynergySystem.ts

```typescript
class SynergySystem {
  // Вызывается при placement, removal, и каждые CHECK_INTERVAL_MS
  update(grid: Tower[][], event: 'placement' | 'tick' | 'removal', pos?: {x,y}): SynergyEffect[]

  // Проверяет пару/тройку башен — возвращает эффект или null
  private checkSynergy(towers: Tower[]): SynergyEffect | null

  // Применяет эффект к врагу
  applyEffect(effect: SynergyEffect, target: Enemy): void
}
```

### NFTParser.ts

```typescript
class NFTParser {
  // Читает все NFT кошелька через near-api-js
  async fetchNFTs(walletAddress: string): Promise<NFTData[]>

  // Парсит метаданные → Tower параметры используя gameData.ts → NFT_RARITY
  parseNFTToTower(nft: RawNEARNFT): NFTData
}
```

### WaveSystem.ts

```typescript
class WaveSystem {
  // Масштабирование: базовый HP × (1 + волна × ENEMY_SCALING.HP_PER_WAVE)
  spawnWave(waveNumber: number): Enemy[]
  
  isBossWave(waveNumber: number): boolean  // каждые 10 волн
}
```

---

## 7. Требования к производительности

| Метрика | Desktop | Mobile |
|---|---|---|
| FPS при 50 башнях + 100 врагах | 60 FPS | 30 FPS |
| Загрузка уровня | ≤ 3 сек | ≤ 5 сек |
| Сохранение в Supabase | ≤ 500ms | ≤ 500ms |
| Подключение NEAR кошелька | ≤ 2 сек | ≤ 3 сек |

**Совместимость:**
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- iOS 14+, Android 10+
- Минимальное разрешение: 375×667 (iPhone SE)

---

## 8. Безопасность

- `near-api-js` только read-only в Фазах 1–2, никаких транзакций
- Приватные ключи никогда не хранятся в клиентском коде
- Supabase RLS обязателен для всех пользовательских таблиц
- Лидерборд валидируется на сервере (минимальный anti-cheat: проверка score vs wave_reached)

---

## 9. Карты (Tiled JSON)

**Структура слоёв (обязательная):**
- `ground` — основной тайловый слой
- `path` — маршрут врагов
- `buildable` — клетки где можно строить
- `decorations` — декоративный слой

**Параметры:**
- Тайловая сетка: 20×15 клеток
- Тайл: 64×64 пикселей
- Waypoints пути — объекты Tiled типа `Point`
- Позиции боссов — объекты слоя `boss_spawn`

---

## 10. Definition of Done

### Фича считается готовой:
- [ ] Код работает в dev (`npm run dev`)
- [ ] TypeScript ошибок нет (`npm run typecheck`)
- [ ] Протестировано в Chrome и Firefox
- [ ] Если изменена схема БД — миграция в `supabase/migrations/`
- [ ] Если изменены игровые цифры — только через `gameData.ts`
- [ ] CHANGELOG.md обновлён
- [ ] TASKS.md обновлён

### Фаза считается завершённой:
- [ ] Milestone достигнут (реальные цифры)
- [ ] Нет P0 багов (краш / потеря прогресса)
- [ ] Деплой на Vercel прошёл
