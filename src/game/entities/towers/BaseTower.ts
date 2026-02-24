/**
 * Базовый класс башни. Элемент, уровень, позиция, урон, дальность, кулдаун.
 * Числа из gameData. Визуал — placeholder (круг по элементу).
 */

import Phaser from 'phaser';
import { GAME_DATA } from '../../constants/gameData';
import type { Element, Tower as TowerData, TargetPriority } from '../../types';

const { ECONOMY } = GAME_DATA;

/** Параметры из gameData; fallback для обратной совместимости. */
export const TOWER_BASE = {
  get rangePx(): number {
    return GAME_DATA.TOWER?.RANGE_PX ?? 380;
  },
  get damage(): number {
    return GAME_DATA.TOWER?.DAMAGE ?? 25;
  },
  get fireRateMs(): number {
    return GAME_DATA.TOWER?.FIRE_RATE_MS ?? 800;
  },
};

export default class BaseTower extends Phaser.GameObjects.Container {
  public readonly towerData: TowerData;
  protected lastShot = 0;
  protected rangeGraphics?: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    gridX: number,
    gridY: number,
    element: Element,
    level: number = 1
  ) {
    const { TILE_SIZE_PX, OFFSET_X } = GAME_DATA.MAP;
    const x = OFFSET_X + (gridX + 0.5) * TILE_SIZE_PX;
    const y = (gridY + 0.5) * TILE_SIZE_PX;
    super(scene, x, y);

    this.towerData = {
      id: `tower_${gridX}_${gridY}_${Date.now()}`,
      element,
      level,
      position: { x: gridX, y: gridY },
      targetPriority: 'FIRST' as TargetPriority,
      isNFT: false,
    };

    const color = elementToColor(element);
    const radius = TILE_SIZE_PX * 0.35;
    const circle = scene.add.circle(0, 0, radius, color);
    this.add(circle);

    scene.add.existing(this);
    this.setPosition(x, y);
    this.setDepth(20);
  }

  get gridX(): number {
    return this.towerData.position.x;
  }

  get gridY(): number {
    return this.towerData.position.y;
  }

  get rangePx(): number {
    return TOWER_BASE.rangePx;
  }

  get damage(): number {
    return TOWER_BASE.damage * Math.pow(ECONOMY.UPGRADE_COST_MULTIPLIER, this.towerData.level - 1);
  }

  get fireRateMs(): number {
    return TOWER_BASE.fireRateMs;
  }

  showRange(visible: boolean): void {
    if (visible && !this.rangeGraphics) {
      this.rangeGraphics = this.scene.add.graphics();
      this.rangeGraphics.lineStyle(2, 0xffffff, 0.35);
      this.rangeGraphics.strokeCircle(0, 0, this.rangePx);
      this.add(this.rangeGraphics);
    }
    if (this.rangeGraphics) this.rangeGraphics.setVisible(visible);
  }

  canShoot(time: number): boolean {
    return time - this.lastShot >= this.fireRateMs;
  }

  markShot(time: number): void {
    this.lastShot = time;
  }

  /** Улучшение на 1 уровень (макс. TOWER.MAX_LEVEL). Визуал обновляется. */
  upgrade(): boolean {
    const maxLv = GAME_DATA.TOWER?.MAX_LEVEL ?? 3;
    if (this.towerData.level >= maxLv) return false;
    this.towerData.level++;
    const scale = 0.85 + this.towerData.level * 0.08;
    this.setScale(scale);
    return true;
  }
}

function elementToColor(element: Element): number {
  const map: Record<Element, number> = {
    FIRE: 0xdd4422,
    ICE: 0x44aaff,
    LIGHTNING: 0xdddd22,
    POISON: 0x88cc44,
    DARK: 0x442288,
    LIGHT: 0xffffaa,
    WIND: 0xaaffcc,
    NONE: 0x888888,
  };
  return map[element] ?? 0x888888;
}
