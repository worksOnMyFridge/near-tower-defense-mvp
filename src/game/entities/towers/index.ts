/**
 * Фабрика башен по элементу. Все 8 базовых типов.
 */

import type { Element } from '../../types';
import BaseTower from './BaseTower';
import FireTower from './FireTower';
import IceTower from './IceTower';
import LightningTower from './LightningTower';
import PoisonTower from './PoisonTower';
import DarkTower from './DarkTower';
import LightTower from './LightTower';
import WindTower from './WindTower';

const TOWER_CLASSES: Record<Exclude<Element, 'NONE'>, new (s: Phaser.Scene, gx: number, gy: number, lv: number) => BaseTower> = {
  FIRE: FireTower,
  ICE: IceTower,
  LIGHTNING: LightningTower,
  POISON: PoisonTower,
  DARK: DarkTower,
  LIGHT: LightTower,
  WIND: WindTower,
};

export function createTower(
  scene: Phaser.Scene,
  element: Exclude<Element, 'NONE'>,
  gridX: number,
  gridY: number,
  level: number = 1
): BaseTower {
  const Klass = TOWER_CLASSES[element];
  return new Klass(scene, gridX, gridY, level);
}

export { BaseTower, FireTower, IceTower, LightningTower, PoisonTower, DarkTower, LightTower, WindTower };
