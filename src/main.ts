import Phaser from 'phaser';
import BootScene from './game/scenes/BootScene';
import MenuScene from './game/scenes/MenuScene';
import GameScene from './game/scenes/GameScene';
import ResultScene from './game/scenes/ResultScene';
import UIScene from './game/scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [BootScene, MenuScene, GameScene, ResultScene, UIScene],
};

const game = new Phaser.Game(config);
// Для DOM-кнопок оверлея (встроенный браузер может некорректно обрабатывать клики по canvas)
declare global {
  interface Window {
    __game?: Phaser.Game;
  }
}
window.__game = game;
export default game;
