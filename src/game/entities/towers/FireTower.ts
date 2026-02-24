/**
 * Башня огня. Прямой урон, поджог. Пока логика как у BaseTower.
 */

import BaseTower from './BaseTower';
import type { Element } from '../../types';

export default class FireTower extends BaseTower {
  constructor(
    scene: Phaser.Scene,
    gridX: number,
    gridY: number,
    level: number = 1
  ) {
    super(scene, gridX, gridY, 'FIRE' as Element, level);
  }
}
