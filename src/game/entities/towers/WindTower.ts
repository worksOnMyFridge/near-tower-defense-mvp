/**
 * Башня ветра. Сбор врагов, распространение эффектов. Пока логика как у BaseTower.
 */

import BaseTower from './BaseTower';
import type { Element } from '../../types';

export default class WindTower extends BaseTower {
  constructor(scene: Phaser.Scene, gridX: number, gridY: number, level: number = 1) {
    super(scene, gridX, gridY, 'WIND' as Element, level);
  }
}
