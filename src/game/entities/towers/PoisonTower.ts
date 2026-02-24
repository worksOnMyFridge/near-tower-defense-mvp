/**
 * Башня яда. Урон со временем (DoT). Пока логика как у BaseTower.
 */

import BaseTower from './BaseTower';
import type { Element } from '../../types';

export default class PoisonTower extends BaseTower {
  constructor(scene: Phaser.Scene, gridX: number, gridY: number, level: number = 1) {
    super(scene, gridX, gridY, 'POISON' as Element, level);
  }
}
