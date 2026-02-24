/**
 * Башня тьмы. Снижение брони, дебаффы. Пока логика как у BaseTower.
 */

import BaseTower from './BaseTower';
import type { Element } from '../../types';

export default class DarkTower extends BaseTower {
  constructor(scene: Phaser.Scene, gridX: number, gridY: number, level: number = 1) {
    super(scene, gridX, gridY, 'DARK' as Element, level);
  }
}
