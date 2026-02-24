import Phaser from 'phaser';

/**
 * Загрузка ассетов. После загрузки переход в MenuScene.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    // Биом Лес: 8 уровней. Пока одна карта для всех; позже — level_tiled_01.json … level_tiled_08.json
    for (let i = 1; i <= 8; i++) {
      this.load.tilemapTiledJSON(`forest_0${i}`, '/level_tiled.json');
    }
  }

  create(): void {
    // Границы canvas для корректного ввода при Scale.FIT
    if (this.scale?.updateBounds) this.scale.updateBounds();
    this.scene.start('Menu');
  }
}
