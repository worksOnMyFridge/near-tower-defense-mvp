/**
 * Ядро синергий. Не менять без review.
 * update(grid, event, pos?) → SynergyEffect[]
 * @see docs/TZ.md раздел 6, PROJECT_BIBLE.md
 */

import { GAME_DATA } from '../constants/gameData';
import type { Tower, SynergyEffect, SynergyType, Element } from '../types';

const { SYNERGY } = GAME_DATA;
const R = SYNERGY.CHECK_RADIUS;

/** Пары элементов для базовых синергий (2 башни). */
const PAIR_SYNERGIES: Array<{ elements: [Element, Element]; type: SynergyType }> = [
  { elements: ['FIRE', 'ICE'], type: 'THERMOSHOCK' },
  { elements: ['LIGHTNING', 'ICE'], type: 'ELECTROSHOCK' },
  { elements: ['POISON', 'FIRE'], type: 'BURNING_BLOOD' },
];

export class SynergySystem {
  /** Ключ: `${type}_${id1}_${id2}`, значение: timestamp (ms) когда кулдаун закончится */
  private cooldownUntil: Map<string, number> = new Map();

  /**
   * Вызывается при размещении/удалении башни и каждые CHECK_INTERVAL_MS в тике.
   * Возвращает список активных синергий с текущим кулдауном.
   */
  update(
    grid: (Tower | null)[][],
    _event: 'placement' | 'tick' | 'removal',
    _pos?: { x: number; y: number }
  ): SynergyEffect[] {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const results: SynergyEffect[] = [];
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;

    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const towerA = grid[gy][gx];
        if (!towerA) continue;

        for (let dy = -R; dy <= R; dy++) {
          for (let dx = -R; dx <= R; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ny = gy + dy;
            const nx = gx + dx;
            if (ny < 0 || ny >= rows || nx < 0 || nx >= cols) continue;
            const towerB = grid[ny][nx];
            if (!towerB || towerA.id >= towerB.id) continue;

            const dist = Math.abs(dx) + Math.abs(dy);
            if (dist > R) continue;

            const effect = this.checkSynergy([towerA, towerB]);
            if (!effect) continue;

            const key = `${effect.type}_${towerA.id}_${towerB.id}`;
            const end = this.cooldownUntil.get(key) ?? 0;
            const cooldownRemaining = Math.max(0, end - now);

            results.push({
              type: effect.type,
              towers: [towerA, towerB],
              isActive: cooldownRemaining <= 0,
              cooldownRemaining,
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Проверяет пару башен на совпадение с известной синергией.
   */
  private checkSynergy(towers: Tower[]): { type: SynergyType; towers: Tower[] } | null {
    if (towers.length < 2) return null;
    const [a, b] = towers;
    const elA = a.element;
    const elB = b.element;

    for (const { elements, type } of PAIR_SYNERGIES) {
      const set = new Set([elA, elB]);
      if (set.has(elements[0]) && set.has(elements[1])) return { type, towers: [a, b] };
    }
    return null;
  }

  /**
   * Стартует кулдаун для синергии (вызывать при срабатывании эффекта).
   */
  startCooldown(effect: SynergyEffect, durationMs: number): void {
    if (effect.towers.length < 2) return;
    const [a, b] = effect.towers;
    const key = `${effect.type}_${a.id}_${b.id}`;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.cooldownUntil.set(key, now + durationMs);
  }

  /**
   * Применение эффекта к цели выполняется в GameScene (доступ к врагам и урону).
   * Здесь только константы для расчётов.
   */
  getConfigForEffect(type: SynergyType): Record<string, number> | null {
    const cfg = SYNERGY[type as keyof typeof SYNERGY];
    return cfg && typeof cfg === 'object' ? (cfg as Record<string, number>) : null;
  }
}
