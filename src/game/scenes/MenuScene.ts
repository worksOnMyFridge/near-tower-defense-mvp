import Phaser from 'phaser';
import {
  initNearWallet,
  getNearAccountId,
  isNearSignedIn,
  requestNearSignIn,
  nearSignOut,
} from '../../web3/NearWallet';

/**
 * Главное меню. Кнопка "Играть" → GameScene, кнопка "Подключить NEAR" → кошелёк.
 * DOM-кнопки — чтобы клики работали во встроенном браузере.
 */
const FOREST_LEVELS = 8;

export default class MenuScene extends Phaser.Scene {
  private menuOverlayRoot: HTMLElement | null = null;
  /** Выбранный уровень биома Лес (1–8). */
  private selectedLevel = 1;
  private levelTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    const cam = this.cameras.main;
    const { width, height } = cam;
    // Непрозрачный фон, чтобы не просвечивала предыдущая сцена
    cam.setBackgroundColor('#1a1a2e');
    this.add.rectangle(width / 2, height / 2, width + 2, height + 2, 0x1a1a2e, 1).setDepth(-1);

    this.add
      .text(width / 2, height / 2 - 80, 'NFTower Defense', {
        fontSize: '32px',
        color: '#e8d4a0',
      })
      .setOrigin(0.5)
      .setDepth(0);

    this.add
      .text(width / 2, height / 2 - 35, 'Биом Лес', {
        fontSize: '18px',
        color: '#8a9a8a',
      })
      .setOrigin(0.5)
      .setDepth(0);

    // Выбор уровня 1–8 (выше кнопки «Играть», чтобы не перекрывались)
    this.levelTexts = [];
    const levelY = height / 2 - 5;
    const levelSpacing = 36;
    const levelStartX = width / 2 - ((FOREST_LEVELS - 1) * levelSpacing) / 2;
    for (let i = 1; i <= FOREST_LEVELS; i++) {
      const lvl = i;
      const txt = this.add
        .text(levelStartX + (lvl - 1) * levelSpacing, levelY, String(lvl), {
          fontSize: '22px',
          color: lvl === this.selectedLevel ? '#f0a500' : '#6a7a6a',
        })
        .setOrigin(0.5)
        .setDepth(0)
        .setInteractive({ useHandCursor: true });
      this.levelTexts.push(txt);
      txt.on('pointerover', () => txt.setColor('#b8e0b8'));
      txt.on('pointerout', () => txt.setColor(lvl === this.selectedLevel ? '#f0a500' : '#6a7a6a'));
      txt.on('pointerdown', () => {
        this.selectedLevel = lvl;
        this.registry.set('forestLevel', lvl);
        this.levelTexts.forEach((t, idx) => t.setColor(idx + 1 === lvl ? '#f0a500' : '#6a7a6a'));
      });
    }

    this.add
      .text(width / 2, height / 2 + 65, 'Играть', {
        fontSize: '24px',
        color: '#8fbc8f',
      })
      .setOrigin(0.5)
      .setDepth(0)
      .setInteractive({ useHandCursor: true });

    this.registry.set('forestLevel', this.selectedLevel);
    this.createMenuDomOverlay();
  }

  shutdown(): void {
    this.menuOverlayRoot?.remove();
    this.menuOverlayRoot = null;
  }

  /** DOM-кнопка "Играть" поверх canvas — обход проблем ввода во встроенном браузере. */
  private createMenuDomOverlay(): void {
    this.menuOverlayRoot?.remove();
    document.getElementById('menu-dom-overlay')?.remove();
    document.getElementById('game-dom-overlay')?.remove();
    document.getElementById('result-dom-overlay')?.remove();
    const canvas = this.sys?.game?.canvas;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) {
      this.time.delayedCall(100, () => this.createMenuDomOverlay());
      return;
    }

    const root = document.createElement('div');
    root.id = 'menu-dom-overlay';
    root.style.cssText =
      'position:fixed;pointer-events:none;z-index:10;left:0;top:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;';
    const inner = document.createElement('div');
    inner.style.cssText = 'position:relative;pointer-events:none;width:100%;height:100%;';
    root.appendChild(inner);

    const syncPosition = (): void => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      inner.style.width = rect.width + 'px';
      inner.style.height = rect.height + 'px';
      root.style.left = rect.left + 'px';
      root.style.top = rect.top + 'px';
      root.style.width = rect.width + 'px';
      root.style.height = rect.height + 'px';
      // Кнопка «Играть» ниже ряда уровней
      const btn = document.getElementById('menu-overlay-play');
      if (btn) {
        const w = 120;
        const h = 44;
        btn.style.left = (rect.width / 2 - w / 2) + 'px';
        btn.style.top = (rect.height / 2 + 65 - h / 2) + 'px';
        btn.style.width = w + 'px';
        btn.style.height = h + 'px';
      }
      // Кнопка NEAR — правый верхний угол (right/top чтобы всегда видна)
      const nearBtn = document.getElementById('menu-overlay-near');
      if (nearBtn) {
        nearBtn.style.left = '';
        nearBtn.style.right = '12px';
        nearBtn.style.top = '12px';
        nearBtn.style.width = '168px';
        nearBtn.style.height = '36px';
      }
    };

    const playBtn = document.createElement('button');
    playBtn.id = 'menu-overlay-play';
    playBtn.textContent = 'Играть';
    playBtn.disabled = false;
    playBtn.style.cssText =
      'position:absolute;pointer-events:auto;cursor:pointer;border:2px solid #5a7a5a;background:#2a3a2a;color:#8fbc8f;font-size:24px;border-radius:8px;';
    playBtn.onmouseover = () => {
      playBtn.style.color = '#b8e0b8';
      playBtn.style.borderColor = '#7a9a7a';
    };
    playBtn.onmouseout = () => {
      playBtn.style.color = '#8fbc8f';
      playBtn.style.borderColor = '#5a7a5a';
    };
    playBtn.onclick = () => {
      playBtn.disabled = true;
      playBtn.style.pointerEvents = 'none';
      document.getElementById('menu-dom-overlay')?.remove();
      this.menuOverlayRoot = null;
      const game = window.__game;
      if (!game?.scene) return;
      const level = (game.registry?.get?.('forestLevel') as number) ?? 1;
      game.scene.stop('Menu');
      game.scene.start('Game', { level });
    };
    inner.appendChild(playBtn);

    const nearBtn = document.createElement('button');
    nearBtn.id = 'menu-overlay-near';
    nearBtn.type = 'button';
    nearBtn.disabled = false;
    nearBtn.textContent = 'Подключить NEAR';
    nearBtn.style.cssText =
      'position:absolute;right:12px;top:12px;pointer-events:auto;cursor:pointer;border:2px solid #6a5a8a;background:#2a2a3a;color:#a090d0;font-size:14px;border-radius:8px;z-index:11;min-width:168px;min-height:36px;';
    nearBtn.onmouseover = () => {
      nearBtn.style.color = '#c0b0e0';
      nearBtn.style.borderColor = '#8a7aaa';
    };
    nearBtn.onmouseout = () => {
      nearBtn.style.color = '#a090d0';
      nearBtn.style.borderColor = '#6a5a8a';
    };
    nearBtn.onclick = () => this.handleNearButtonClick(nearBtn);
    inner.appendChild(nearBtn);

    parent.appendChild(root);
    this.menuOverlayRoot = root;
    this.time.delayedCall(50, syncPosition);
    syncPosition();
    this.updateNearButtonState(nearBtn);
  }

  private async updateNearButtonState(nearBtn: HTMLButtonElement): Promise<void> {
    try {
      await initNearWallet();
      const signedIn = await isNearSignedIn();
      nearBtn.disabled = false;
      if (signedIn) {
        const accountId = await getNearAccountId();
        nearBtn.textContent = accountId ? `✓ ${this.shortAccountId(accountId)}` : '✓ NEAR';
        nearBtn.title = accountId ?? 'Подключён';
      } else {
        nearBtn.textContent = 'Подключить NEAR';
        nearBtn.title = '';
      }
    } catch {
      nearBtn.disabled = false;
      nearBtn.textContent = 'Подключить NEAR';
      nearBtn.title = '';
    }
  }

  private shortAccountId(accountId: string): string {
    if (accountId.length <= 20) return accountId;
    return accountId.slice(0, 8) + '…' + accountId.slice(-8);
  }

  private async handleNearButtonClick(nearBtn: HTMLButtonElement): Promise<void> {
    const signedIn = await isNearSignedIn();
    if (signedIn) {
      await nearSignOut();
      nearBtn.textContent = 'Подключить NEAR';
      nearBtn.title = '';
    } else {
      nearBtn.disabled = true;
      nearBtn.textContent = 'Открываю…';
      const ok = await requestNearSignIn();
      nearBtn.disabled = false;
      if (ok) {
        await this.updateNearButtonState(nearBtn);
      } else {
        nearBtn.textContent = 'Подключить NEAR';
      }
    }
  }
}
