/**
 * Башня света. Детект невидимых, бафф союзников. Пока логика как у BaseTower.
 */

import BaseTower from './BaseTower';
import type { Element } from '../../types';

export default class LightTower extends BaseTower {
  constructor(scene: Phaser.Scene, gridX: number, gridY: number, level: number = 1) {
    super(scene, gridX, gridY, 'LIGHT' as Element, level);
  }
}
