/**
 * Башня молнии. Цепной урон по группам. Пока логика как у BaseTower.
 */

import BaseTower from './BaseTower';
import type { Element } from '../../types';

export default class LightningTower extends BaseTower {
  constructor(scene: Phaser.Scene, gridX: number, gridY: number, level: number = 1) {
    super(scene, gridX, gridY, 'LIGHTNING' as Element, level);
  }
}
