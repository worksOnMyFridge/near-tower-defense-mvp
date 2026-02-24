import Phaser from 'phaser';

const HUD_OFFSET_X = 160;

/**
 * HUD поверх игры: золото, жизни, волна, кнопка «Меню».
 * Данные берёт из registry (обновляет GameScene).
 */
export default class UIScene extends Phaser.Scene {
  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UI' });
  }

  create(): void {
    const gold = this.registry.get('hud_gold') ?? 0;
    const lives = this.registry.get('hud_lives') ?? 20;
    const wave = this.registry.get('hud_wave') ?? 0;

    this.goldText = this.add
      .text(HUD_OFFSET_X, 8, `Золото: ${gold}`, { fontSize: '18px', color: '#ddc' })
      .setDepth(1000);
    this.livesText = this.add
      .text(HUD_OFFSET_X + 200, 8, `Жизни: ${lives}`, { fontSize: '18px', color: '#f88' })
      .setDepth(1000);
    this.waveText = this.add
      .text(HUD_OFFSET_X + 400, 8, `Волна: ${wave}`, { fontSize: '18px', color: '#8cf' })
      .setDepth(1000);

    const back = this.add
      .text(24, 24, '← Меню', { fontSize: '16px', color: '#8fbc8f' })
      .setDepth(1000)
      .setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#b8e0b8'));
    back.on('pointerout', () => back.setColor('#8fbc8f'));
    back.on('pointerdown', () => {
      this.game.scene.stop('Game');
      this.game.scene.stop('UI');
      this.game.scene.start('Menu');
    });
  }

  update(): void {
    const gold = this.registry.get('hud_gold') ?? 0;
    const lives = this.registry.get('hud_lives') ?? 20;
    const wave = this.registry.get('hud_wave') ?? 0;
    this.goldText.setText(`Золото: ${gold}`);
    this.livesText.setText(`Жизни: ${lives}`);
    this.waveText.setText(`Волна: ${wave}`);
  }
}
