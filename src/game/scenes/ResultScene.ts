import Phaser from 'phaser';

export interface ResultSceneData {
  win: boolean;
  wave: number;
  /** Уровень биома Лес (1–8). Нужен для «Играть снова» и «След. уровень». */
  level?: number;
}

/**
 * Экран результата: Победа или Поражение. Кнопки «В меню» и «Играть снова».
 * DOM-кнопки — чтобы клики работали во встроенном браузере.
 */
export default class ResultScene extends Phaser.Scene {
  private resultOverlayRoot: HTMLElement | null = null;

  constructor() {
    super({ key: 'Result' });
  }

  create(data: ResultSceneData): void {
    const { width, height } = this.cameras.main;
    const win = data?.win ?? false;
    const wave = typeof data?.wave === 'number' ? data.wave : 0;
    const level = Math.min(8, Math.max(1, data?.level ?? 1));
    const canNextLevel = win && level < 8;

    const title = win ? 'Победа!' : 'Поражение';
    const color = win ? '#8fbc8f' : '#cc6666';
    this.add
      .text(width / 2, height / 2 - 80, title, {
        fontSize: '42px',
        color,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 20, `Уровень ${level} · Волна: ${wave}`, {
        fontSize: '22px',
        color: '#e8d4a0',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 40, 'В меню', { fontSize: '24px', color: '#8fbc8f' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(width / 2, height / 2 + 90, 'Играть снова', { fontSize: '24px', color: '#e0a040' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    if (canNextLevel) {
      this.add
        .text(width / 2, height / 2 + 140, 'След. уровень', { fontSize: '24px', color: '#f0a500' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
    }

    this.createResultDomOverlay(level, canNextLevel);
  }

  shutdown(): void {
    this.resultOverlayRoot?.remove();
    this.resultOverlayRoot = null;
  }

  /** DOM-кнопки «В меню», «Играть снова», при победе — «След. уровень». */
  private createResultDomOverlay(level: number, showNextLevel: boolean): void {
    this.resultOverlayRoot?.remove();
    document.getElementById('game-dom-overlay')?.remove();
    document.getElementById('menu-dom-overlay')?.remove();
    const canvas = this.sys?.game?.canvas;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const root = document.createElement('div');
    root.id = 'result-dom-overlay';
    root.style.cssText =
      'position:fixed;pointer-events:none;z-index:10;left:0;top:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;';
    const inner = document.createElement('div');
    inner.style.cssText = 'position:relative;pointer-events:none;';
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
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const menuBtn = document.getElementById('result-overlay-menu');
      const againBtn = document.getElementById('result-overlay-again');
      const nextBtn = document.getElementById('result-overlay-next');
      if (menuBtn) {
        menuBtn.style.left = (cx - 70) + 'px';
        menuBtn.style.top = (cy + 40 - 18) + 'px';
        menuBtn.style.width = '140px';
        menuBtn.style.height = '36px';
      }
      if (againBtn) {
        againBtn.style.left = (cx - 85) + 'px';
        againBtn.style.top = (cy + 90 - 18) + 'px';
        againBtn.style.width = '170px';
        againBtn.style.height = '36px';
      }
      if (nextBtn) {
        nextBtn.style.left = (cx - 75) + 'px';
        nextBtn.style.top = (cy + 140 - 18) + 'px';
        nextBtn.style.width = '150px';
        nextBtn.style.height = '36px';
      }
    };

    const menuBtn = document.createElement('button');
    menuBtn.id = 'result-overlay-menu';
    menuBtn.textContent = 'В меню';
    menuBtn.style.cssText =
      'position:absolute;pointer-events:auto;cursor:pointer;border:2px solid #5a7a5a;background:#2a3a2a;color:#8fbc8f;font-size:22px;border-radius:8px;';
    menuBtn.onclick = () => {
      menuBtn.disabled = true;
      setTimeout(() => {
        window.__game?.scene.stop('Result');
        window.__game?.scene.start('Menu');
      }, 0);
    };

    const againBtn = document.createElement('button');
    againBtn.id = 'result-overlay-again';
    againBtn.textContent = 'Играть снова';
    againBtn.style.cssText =
      'position:absolute;pointer-events:auto;cursor:pointer;border:2px solid #8a6a30;background:#2a3a2a;color:#e0a040;font-size:22px;border-radius:8px;';
    againBtn.onclick = () => {
      againBtn.disabled = true;
      setTimeout(() => {
        const game = window.__game;
        if (!game?.scene) return;
        game.registry?.set?.('forestLevel', level);
        game.scene.stop('Result');
        game.scene.start('Game', { level });
      }, 0);
    };

    inner.appendChild(menuBtn);
    inner.appendChild(againBtn);

    if (showNextLevel) {
      const nextBtn = document.createElement('button');
      nextBtn.id = 'result-overlay-next';
      nextBtn.textContent = 'След. уровень';
      nextBtn.style.cssText =
        'position:absolute;pointer-events:auto;cursor:pointer;border:2px solid #a08030;background:#2a3a2a;color:#f0a500;font-size:22px;border-radius:8px;';
      nextBtn.onclick = () => {
        nextBtn.disabled = true;
        setTimeout(() => {
          const game = window.__game;
          if (!game?.scene) return;
          const nextLevel = level + 1;
          game.registry?.set?.('forestLevel', nextLevel);
          game.scene.stop('Result');
          game.scene.start('Game', { level: nextLevel });
        }, 0);
      };
      inner.appendChild(nextBtn);
    }

    parent.appendChild(root);
    this.resultOverlayRoot = root;
    this.time.delayedCall(50, syncPosition);
    syncPosition();
  }
}
