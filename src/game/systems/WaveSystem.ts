/**
 * Волны врагов. Масштабирование HP по gameData.ENEMY_SCALING.
 * spawnWave(waveNumber) → Enemy[]; isBossWave(waveNumber).
 * На волнах 10, 20, … — босс + часть обычных врагов.
 */

import { GAME_DATA } from '../constants/gameData';
import type { Enemy, EnemyType, Element } from '../types';

const { ENEMY_BASE, ENEMY_SCALING } = GAME_DATA;

/** Иммунитеты по типу: FLYING — к замедлению/заморозке (ICE). */
const ENEMY_IMMUNITIES: Partial<Record<EnemyType, Element[]>> = {
  FLYING: ['ICE'],
};

function scaleHp(baseHp: number, wave: number, bossMultiplier = 1): number {
  return Math.floor(baseHp * (1 + wave * ENEMY_SCALING.HP_PER_WAVE) * bossMultiplier);
}

export function isBossWave(waveNumber: number): boolean {
  return waveNumber > 0 && waveNumber % 10 === 0;
}

/** Выбор типа врага в зависимости от волны (не BOSS). */
function pickEnemyType(waveNumber: number, index: number): Exclude<EnemyType, 'BOSS'> {
  const r = (waveNumber * 7 + index * 11) % 100;
  if (waveNumber >= 5 && r < 15) return 'INVISIBLE';
  if (waveNumber >= 4 && r < 30) return 'FLYING';
  if (waveNumber >= 3 && r < 50) return 'FAST';
  if (waveNumber >= 2 && r < 75) return 'ARMORED';
  return 'INFANTRY';
}

/** Базовые статы по типу из gameData. */
function getBaseForType(type: EnemyType): { hp: number; speed: number; reward: number } {
  const key = type as keyof typeof ENEMY_BASE;
  return ENEMY_BASE[key] ?? ENEMY_BASE.INFANTRY;
}

/** Генерирует список врагов для волны (микс типов; на волне 10, 20, … — босс). */
export function spawnWave(waveNumber: number): Enemy[] {
  const enemies: Enemy[] = [];
  const normalCount = 5 + waveNumber * 2;
  const isBoss = isBossWave(waveNumber);
  const minionCount = isBoss ? Math.max(3, Math.floor(normalCount / 2)) : normalCount;

  for (let i = 0; i < minionCount; i++) {
    const type = pickEnemyType(waveNumber, i);
    const base = getBaseForType(type);
    const hp = scaleHp(base.hp, waveNumber);
    enemies.push({
      id: `enemy_${waveNumber}_${i}`,
      type,
      hp,
      maxHp: hp,
      speed: base.speed,
      immunities: ENEMY_IMMUNITIES[type] ?? [],
      reward: base.reward,
      statusEffects: [],
    });
  }

  if (isBoss) {
    const bossBase = getBaseForType('BOSS');
    const bossHpMult = (ENEMY_SCALING as { BOSS_HP_MULTIPLIER?: number }).BOSS_HP_MULTIPLIER ?? 1.5;
    const bossHp = scaleHp(bossBase.hp, waveNumber, bossHpMult);
    enemies.push({
      id: `enemy_${waveNumber}_boss`,
      type: 'BOSS',
      hp: bossHp,
      maxHp: bossHp,
      speed: bossBase.speed,
      immunities: [],
      reward: bossBase.reward,
      statusEffects: [],
    });
  }

  return enemies;
}
