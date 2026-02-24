/**
 * Основной игровой экран: сетка 20×15, buildable, путь врагов, размещение башен, волны.
 */

import Phaser from 'phaser';
import { GAME_DATA } from '../constants/gameData';
import { spawnWave } from '../systems/WaveSystem';
import { SynergySystem } from '../systems/SynergySystem';
import BaseTower from '../entities/towers/BaseTower';
import { createTower } from '../entities/towers/index';
import BaseEnemy from '../entities/enemies/BaseEnemy';
import type { Element } from '../types';
import type { SynergyEffect, Tower } from '../types';
import { getBuildableFromTilemap, getWaypointsFromTilemap } from '../maps/parseTiledMap';
import { saveProgressAfterWave } from '../../db/gameProgress';

const { MAP, ECONOMY, SYNERGY } = GAME_DATA;
const OFFSET_X = 160;
const TILE = MAP.TILE_SIZE_PX;
const COLS = MAP.GRID_COLS;
const ROWS = MAP.GRID_ROWS;

const TOWER_ELEMENTS: Exclude<Element, 'NONE'>[] = ['FIRE', 'ICE', 'LIGHTNING', 'POISON', 'DARK', 'LIGHT', 'WIND'];
const TOWER_LABELS: Record<Exclude<Element, 'NONE'>, string> = {
  FIRE: '🔥',
  ICE: '❄️',
  LIGHTNING: '⚡',
  POISON: '☠️',
  DARK: '🌑',
  LIGHT: '☀️',
  WIND: '🌪️',
};

export default class GameScene extends Phaser.Scene {
  private buildable: boolean[][] = [];
  private waypoints: { x: number; y: number }[] = [];
  private towers: BaseTower[] = [];
  private enemies: BaseEnemy[] = [];
  private gold = 300;
  private lives = 20;
  private waveNumber = 0;
  private waveInProgress = false;
  /** Были ли за текущую волну уже заспавнены враги (чтобы не считать волну «очищенной» до первого спавна). */
  private waveHadEnemies = false;
  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private pauseBtnText?: Phaser.GameObjects.Text;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private selectedTowerType: Exclude<Element, 'NONE'> = 'FIRE';
  private selectedTower: BaseTower | null = null;
  private towerPreview?: Phaser.GameObjects.Graphics;
  private towerButtons: Map<Exclude<Element, 'NONE'>, Phaser.GameObjects.Container> = new Map();
  private upgradeText?: Phaser.GameObjects.Text;
  private lastGold = -1;
  private lastLives = -1;
  private synergySystem = new SynergySystem();
  private activeSynergies: SynergyEffect[] = [];
  private synergyLines?: Phaser.GameObjects.Graphics;
  private antiSynergyWarningText?: Phaser.GameObjects.Text;
  private transitioningToResult = false;
  private paused = false;
  /** Текущий уровень биома Лес (1–8). */
  private forestLevel = 1;
  /** DOM-оверлей для кнопок (обход проблем ввода во встроенном браузере). */
  private domOverlayRoot: HTMLElement | null = null;
  private domResizeHandler?: () => void;
  private domSelectTowerHandler?: (e: Event) => void;
  private domUpgradeHandler?: () => void;
  private domGridClickHandler?: (e: Event) => void;

  constructor() {
    super({ key: 'Game' });
  }

  create(data?: { level?: number }): void {
    // Убираем оверлеи других сцен, чтобы не оставались поверх игры
    document.getElementById('menu-dom-overlay')?.remove();
    document.getElementById('result-dom-overlay')?.remove();

    // Непрозрачный фон камеры — чтобы не просвечивало содержимое меню
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Обновляем границы canvas — при Scale.FIT без этого клики могут не попадать в объекты
    if (this.scale?.updateBounds) this.scale.updateBounds();
    this.time.delayedCall(100, () => {
      if (this.scale?.updateBounds) this.scale.updateBounds();
    });

    // Уровень: из данных сцены (Result → Играть снова/След. уровень) или из registry (меню)
    const reg = this.registry.get('forestLevel') as number | undefined;
    this.forestLevel = Math.min(8, Math.max(1, data?.level ?? reg ?? 1));

    // При рестарте (Играть снова) Phaser переиспользует сцену — сбрасываем всё состояние
    this.resetGameState();
    this.initBuildableAndPathFromMap();
    this.drawGrid();
    this.createTowerSidebar();
    this.createHud();
    this.lastGold = this.gold;
    this.lastLives = this.lives;
    this.setupInput();
    this.time.delayedCall(0, () => this.createDomOverlay());
    this.startNextWave();
    // Если перешли с экрана результата — закрываем его, чтобы не оставался поверх
    if (this.scene.manager.isActive('Result')) this.scene.manager.stop('Result');
  }

  shutdown(): void {
    this.removeDomOverlay();
  }

  /** Оверлей с HTML-кнопками поверх canvas — клики обрабатывает браузер. */
  private createDomOverlay(): void {
    this.removeDomOverlay();
    document.getElementById('menu-dom-overlay')?.remove();
    document.getElementById('result-dom-overlay')?.remove();
    const canvas = this.sys?.game?.canvas;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) {
      this.time.delayedCall(150, () => this.createDomOverlay());
      return;
    }

    const root = document.createElement('div');
    root.id = 'game-dom-overlay';
    root.style.cssText =
      'position:fixed;pointer-events:none;z-index:10;left:0;top:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;';
    const inner = document.createElement('div');
    inner.style.cssText = 'position:relative;pointer-events:none;';
    root.appendChild(inner);

    const GAME_W = 1280;
    const GAME_H = 720;

    const syncPosition = (): void => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      inner.style.width = rect.width + 'px';
      inner.style.height = rect.height + 'px';
      root.style.left = rect.left + 'px';
      root.style.top = rect.top + 'px';
      root.style.width = rect.width + 'px';
      root.style.height = rect.height + 'px';
      const scaleX = rect.width / GAME_W;
      const scaleY = rect.height / GAME_H;

      const menuBtn = document.getElementById('game-overlay-menu');
      if (menuBtn) {
        menuBtn.style.left = 24 * scaleX + 'px';
        menuBtn.style.top = 24 * scaleY + 'px';
      }
      document.querySelectorAll<HTMLElement>('[data-overlay-tower]').forEach((el, i) => {
        el.style.left = 12 * scaleX + 'px';
        el.style.top = (60 + i * 32) * scaleY + 'px';
        el.style.width = 68 * scaleX + 'px';
        el.style.height = 28 * scaleY + 'px';
      });
      const upBtn = document.getElementById('game-overlay-upgrade');
      if (upBtn) {
        const upgradeY = 60 + TOWER_ELEMENTS.length * 32 + 4 + 28; // как в createTowerSidebar
        upBtn.style.left = 12 * scaleX + 'px';
        upBtn.style.top = upgradeY * scaleY + 'px';
        upBtn.style.width = Math.min(220 * scaleX, rect.width - 24 * scaleX) + 'px';
        upBtn.style.height = 24 * scaleY + 'px';
      }
      const gridEl = document.getElementById('game-overlay-grid');
      if (gridEl) {
        gridEl.style.left = OFFSET_X * scaleX + 'px';
        gridEl.style.top = '0';
        gridEl.style.width = COLS * TILE * scaleX + 'px';
        gridEl.style.height = ROWS * TILE * scaleY + 'px';
      }
      const pauseEl = document.getElementById('game-overlay-pause');
      if (pauseEl) {
        pauseEl.style.left = (OFFSET_X + 580) * scaleX + 'px';
        pauseEl.style.top = 8 * scaleY + 'px';
        pauseEl.style.width = 90 * scaleX + 'px';
        pauseEl.style.height = 24 * scaleY + 'px';
      }
    };

    const menuBtn = document.createElement('button');
    menuBtn.id = 'game-overlay-menu';
    menuBtn.textContent = '← Меню';
    menuBtn.setAttribute('data-overlay-btn', 'menu');
    menuBtn.style.cssText =
      'position:absolute;pointer-events:auto;cursor:pointer;border:1px solid #555;background:#2a3a2a;color:#8fbc8f;font-size:14px;padding:4px 8px;border-radius:4px;';
    menuBtn.onmouseover = () => {
      menuBtn.style.color = '#b8e0b8';
    };
    menuBtn.onmouseout = () => {
      menuBtn.style.color = '#8fbc8f';
    };
    menuBtn.onclick = () => {
      menuBtn.disabled = true;
      document.getElementById('game-dom-overlay')?.remove();
      this.domOverlayRoot = null;
      const game = window.__game;
      if (!game?.scene) return;
      // Переключаем сцену в следующем тике, чтобы не вызывать stop изнутри сцены
      setTimeout(() => {
        game.scene.stop('Game');
        game.scene.start('Menu');
      }, 50);
    };
    inner.appendChild(menuBtn);

    TOWER_ELEMENTS.forEach((el) => {
      const btn = document.createElement('button');
      btn.setAttribute('data-overlay-tower', el);
      btn.textContent = TOWER_LABELS[el];
      btn.style.cssText =
        'position:absolute;pointer-events:auto;cursor:pointer;border:1px solid #444;background:rgba(42,42,42,0.95);color:#ccc;font-size:16px;display:flex;align-items:center;justify-content:center;';
      btn.onclick = () => {
        document.dispatchEvent(new CustomEvent<Exclude<Element, 'NONE'>>('game-select-tower', { detail: el }));
      };
      inner.appendChild(btn);
    });

    const upgradeBtn = document.createElement('button');
    upgradeBtn.id = 'game-overlay-upgrade';
    upgradeBtn.setAttribute('data-overlay-btn', 'upgrade');
    upgradeBtn.style.cssText =
      'position:absolute;pointer-events:auto;cursor:pointer;border:none;background:transparent;color:#6a8;font-size:11px;text-align:left;';
    upgradeBtn.onclick = () => {
      document.dispatchEvent(new CustomEvent('game-upgrade-tower'));
    };
    inner.appendChild(upgradeBtn);

    const pauseBtn = document.createElement('button');
    pauseBtn.id = 'game-overlay-pause';
    pauseBtn.textContent = this.paused ? 'Продолжить' : 'Пауза';
    pauseBtn.setAttribute('data-overlay-btn', 'pause');
    pauseBtn.style.cssText =
      'position:absolute;pointer-events:auto;cursor:pointer;border:1px solid #8a6a30;background:#2a3a2a;color:#e0a040;font-size:14px;';
    pauseBtn.onclick = () => this.togglePause();
    inner.appendChild(pauseBtn);

    const gridOverlay = document.createElement('div');
    gridOverlay.id = 'game-overlay-grid';
    gridOverlay.setAttribute('data-overlay-btn', 'grid');
    gridOverlay.style.cssText =
      'position:absolute;pointer-events:auto;cursor:pointer;left:0;top:0;';
    gridOverlay.onclick = (e: MouseEvent) => {
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const gx = Math.floor((x / rect.width) * COLS);
      const gy = Math.floor((y / rect.height) * ROWS);
      if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) {
        document.dispatchEvent(new CustomEvent('game-grid-click', { detail: { gx, gy } }));
      }
    };
    inner.appendChild(gridOverlay);

    this.domSelectTowerHandler = (e: Event) => {
      const el = (e as CustomEvent).detail as Exclude<Element, 'NONE'>;
      this.selectedTowerType = el;
      this.updateTowerSidebarHighlight();
      document.querySelectorAll('[data-overlay-tower]').forEach((n) => n.classList.remove('selected'));
      const sel = document.querySelector(`[data-overlay-tower="${el}"]`);
      if (sel) (sel as HTMLElement).style.borderColor = '#88ff88';
      document.querySelectorAll('[data-overlay-tower]').forEach((n) => {
        if (n !== sel) (n as HTMLElement).style.borderColor = '#444';
      });
    };
    this.domUpgradeHandler = () => this.doUpgradeSelectedTower();
    this.domGridClickHandler = (e: Event) => {
      const { gx, gy } = (e as CustomEvent).detail as { gx: number; gy: number };
      this.handleGridCellClick(gx, gy);
    };
    document.addEventListener('game-select-tower', this.domSelectTowerHandler);
    document.addEventListener('game-upgrade-tower', this.domUpgradeHandler);
    document.addEventListener('game-grid-click', this.domGridClickHandler);

    this.domResizeHandler = () => {
      this.time.delayedCall(50, syncPosition);
    };
    window.addEventListener('resize', this.domResizeHandler);

    parent.appendChild(root);
    this.domOverlayRoot = root;
    this.time.delayedCall(50, syncPosition);
    syncPosition();
    // Начальная подсветка выбранного типа башни
    const selEl = document.querySelector(`[data-overlay-tower="${this.selectedTowerType}"]`);
    if (selEl) (selEl as HTMLElement).style.borderColor = '#88ff88';
  }

  private removeDomOverlay(): void {
    if (this.domResizeHandler) {
      window.removeEventListener('resize', this.domResizeHandler);
      this.domResizeHandler = undefined;
    }
    if (this.domSelectTowerHandler) {
      document.removeEventListener('game-select-tower', this.domSelectTowerHandler);
      this.domSelectTowerHandler = undefined;
    }
    if (this.domUpgradeHandler) {
      document.removeEventListener('game-upgrade-tower', this.domUpgradeHandler);
      this.domUpgradeHandler = undefined;
    }
    if (this.domGridClickHandler) {
      document.removeEventListener('game-grid-click', this.domGridClickHandler);
      this.domGridClickHandler = undefined;
    }
    this.domOverlayRoot?.remove();
    this.domOverlayRoot = null;
  }

  private resetGameState(): void {
    this.gold = 300;
    this.lives = 20;
    this.waveNumber = 0;
    this.waveInProgress = false;
    this.waveHadEnemies = false;
    this.transitioningToResult = false;
    this.lastGold = -1;
    this.lastLives = -1;
    for (const t of this.towers) {
      try {
        if (t && t.active) t.destroy();
      } catch {
        // игнорируем ошибки при уничтожении (объект уже удалён)
      }
    }
    this.towers = [];
    for (const e of this.enemies) {
      try {
        if (e && e.active) e.destroy();
      } catch {
        // игнорируем ошибки при уничтожении
      }
    }
    this.enemies = [];
    this.activeSynergies = [];
    this.synergySystem = new SynergySystem();
    this.selectedTower = null;
    this.paused = false;
    try {
      if (this.antiSynergyWarningText) {
        this.antiSynergyWarningText.destroy();
        this.antiSynergyWarningText = undefined;
      }
    } catch {
      // игнорируем ошибки при уничтожении текста
    }
    // Не вызываем updateHudText() здесь: при рестарте HUD ещё не создан или ссылается на старые объекты
  }

  private createHud(): void {
    const HUD_DEPTH = 1000;
    this.goldText = this.add.text(OFFSET_X, 8, `Золото: ${this.gold}`, { fontSize: '18px', color: '#ddc' }).setDepth(HUD_DEPTH);
    this.livesText = this.add.text(OFFSET_X + 200, 8, `Жизни: ${this.lives}`, { fontSize: '18px', color: '#f88' }).setDepth(HUD_DEPTH);
    this.waveText = this.add.text(OFFSET_X + 400, 8, `Ур.${this.forestLevel} | Волна: ${this.waveNumber}`, { fontSize: '18px', color: '#8cf' }).setDepth(HUD_DEPTH);
    const back = this.add.text(24, 24, '← Меню', { fontSize: '16px', color: '#8fbc8f' }).setDepth(HUD_DEPTH).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#b8e0b8'));
    back.on('pointerout', () => back.setColor('#8fbc8f'));
    back.on('pointerdown', () => this.scene.start('Menu'));
    const pauseBtn = this.add.text(OFFSET_X + 580, 8, this.paused ? 'Продолжить' : 'Пауза', { fontSize: '16px', color: '#e0a040' }).setDepth(HUD_DEPTH).setInteractive({ useHandCursor: true });
    this.pauseBtnText = pauseBtn;
    pauseBtn.on('pointerover', () => pauseBtn.setColor('#f0c050'));
    pauseBtn.on('pointerout', () => pauseBtn.setColor('#e0a040'));
    pauseBtn.on('pointerdown', () => this.togglePause());
  }

  private togglePause(): void {
    this.paused = !this.paused;
    if (this.pauseBtnText) this.pauseBtnText.setText(this.paused ? 'Продолжить' : 'Пауза');
    const domPause = document.getElementById('game-overlay-pause');
    if (domPause) domPause.textContent = this.paused ? 'Продолжить' : 'Пауза';
  }

  private updateHudText(): void {
    if (this.goldText) this.goldText.setText(`Золото: ${this.gold}`);
    if (this.livesText) this.livesText.setText(`Жизни: ${this.lives}`);
    if (this.waveText) this.waveText.setText(`Ур.${this.forestLevel} | Волна: ${this.waveNumber}`);
  }

  update(_time: number, delta: number): void {
    this.tick(delta);
  }

  private initBuildableAndPathFromMap(): void {
    const mapKey = `forest_0${this.forestLevel}`;
    try {
      const map = this.make.tilemap({ key: mapKey });
      if (map && map.getLayer('path') && map.getObjectLayer('waypoints')) {
        const buildable = getBuildableFromTilemap(map);
        const waypoints = getWaypointsFromTilemap(map);
        if (buildable.length === ROWS && buildable[0].length === COLS && waypoints.length > 0) {
          this.buildable = buildable;
          this.waypoints = waypoints;
          return;
        }
      }
    } catch (_) {
      // карта не загружена или неверный формат
    }
    this.initBuildableAndPathFallback();
  }

  private initBuildableAndPathFallback(): void {
    for (let gy = 0; gy < ROWS; gy++) {
      this.buildable[gy] = [];
      for (let gx = 0; gx < COLS; gx++) {
        const onPath = gy === 7 && gx >= 2 && gx <= 17;
        this.buildable[gy][gx] = !onPath;
      }
    }
    this.waypoints = [
      { x: OFFSET_X + 2 * TILE + TILE / 2, y: 7 * TILE + TILE / 2 },
      { x: OFFSET_X + 8 * TILE + TILE / 2, y: 7 * TILE + TILE / 2 },
      { x: OFFSET_X + 14 * TILE + TILE / 2, y: 7 * TILE + TILE / 2 },
      { x: OFFSET_X + 17 * TILE + TILE / 2, y: 7 * TILE + TILE / 2 },
    ];
  }

  private drawGrid(): void {
    this.gridGraphics = this.add.graphics().setDepth(0);
    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < COLS; gx++) {
        const x = OFFSET_X + gx * TILE;
        const y = gy * TILE;
        const build = this.buildable[gy][gx];
        this.gridGraphics.fillStyle(build ? 0x2a3a2a : 0x1a2520, 0.9);
        this.gridGraphics.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
        this.gridGraphics.lineStyle(1, build ? 0x3a4a3a : 0x2a3530, 1);
        this.gridGraphics.strokeRect(x, y, TILE, TILE);
      }
    }
  }

  private createTowerSidebar(): void {
    const UI_DEPTH = 500;
    const x = 12;
    let y = 60;
    this.add.text(x, y - 22, 'Башня', { fontSize: '14px', color: '#aaa' }).setDepth(UI_DEPTH);
    for (const el of TOWER_ELEMENTS) {
      const cx = x + 34;
      const cy = y + 14;
      const bg = this.add.rectangle(0, 0, 68, 28, 0x2a2a2a, 0.95).setStrokeStyle(2, 0x444).setDepth(UI_DEPTH);
      const label = this.add.text(0, 0, TOWER_LABELS[el], { fontSize: '18px' }).setOrigin(0.5).setDepth(UI_DEPTH);
      const container = this.add.container(cx, cy, [bg, label]).setDepth(UI_DEPTH);
      container.setSize(68, 28);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => {
        this.selectedTowerType = el;
        this.updateTowerSidebarHighlight();
      });
      this.towerButtons.set(el, container);
      y += 32;
    }
    this.add.text(x, y + 4, `${ECONOMY.TOWER_BASE_COST} за башню`, { fontSize: '11px', color: '#8a8' }).setDepth(UI_DEPTH);
    y += 28;
    this.upgradeText = this.add.text(x, y, 'Клик по башне → Улучшить', { fontSize: '11px', color: '#6a8' }).setDepth(UI_DEPTH);
    this.updateTowerSidebarHighlight();
    this.updateUpgradePanel();
  }

  private getUpgradeCost(fromLevel: number): number {
    return Math.floor(ECONOMY.TOWER_BASE_COST * Math.pow(ECONOMY.UPGRADE_COST_MULTIPLIER, fromLevel));
  }

  private getTowerAt(gx: number, gy: number): BaseTower | null {
    return this.towers.find((t) => t.active && t.gridX === gx && t.gridY === gy) ?? null;
  }

  private updateUpgradePanel(): void {
    if (!this.upgradeText) return;
    this.upgradeText.off('pointerdown');
    if (!this.selectedTower || !this.selectedTower.active) {
      this.upgradeText.setText('Клик по башне → Улучшить').setColor('#6a8').removeInteractive();
      return;
    }
    const t = this.selectedTower;
    const maxLv = GAME_DATA.TOWER?.MAX_LEVEL ?? 3;
    if (t.towerData.level >= maxLv) {
      this.upgradeText.setText(`Уровень ${t.towerData.level} (макс)`).setColor('#8a8').removeInteractive();
      return;
    }
    const cost = this.getUpgradeCost(t.towerData.level);
    this.upgradeText.setText(`Уровень ${t.towerData.level} → Улучшить: ${cost}`).setColor(this.gold >= cost ? '#8f8' : '#a66').setInteractive({ useHandCursor: true });
    this.upgradeText.once('pointerdown', () => this.doUpgradeSelectedTower());
  }

  private doUpgradeSelectedTower(): void {
    if (!this.selectedTower || !this.selectedTower.active) return;
    const t = this.selectedTower;
    const maxLv = GAME_DATA.TOWER?.MAX_LEVEL ?? 3;
    if (t.towerData.level >= maxLv) return;
    const cost = this.getUpgradeCost(t.towerData.level);
    if (this.gold < cost) return;
    this.gold -= cost;
    t.upgrade();
    this.updateHudText();
    this.updateUpgradePanel();
  }

  private updateTowerSidebarHighlight(): void {
    const sel = this.selectedTowerType;
    for (const [el, container] of this.towerButtons) {
      const rect = container.list[0] as Phaser.GameObjects.Rectangle;
      rect.setStrokeStyle(2, el === sel ? 0x88ff88 : 0x444444);
    }
  }

  private setupInput(): void {
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      const gx = Math.floor((ptr.x - OFFSET_X) / TILE);
      const gy = Math.floor(ptr.y / TILE);
      if (this.towerPreview) this.towerPreview.destroy();
      if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS && this.buildable[gy][gx]) {
        this.towerPreview = this.add.graphics();
        const color = this.getPreviewColorForElement(this.selectedTowerType);
        this.towerPreview.lineStyle(2, color, 0.7);
        this.towerPreview.strokeCircle(OFFSET_X + (gx + 0.5) * TILE, (gy + 0.5) * TILE, TILE * 0.35);
        this.towerPreview.setDepth(50);
      }
    });

    const gridZone = this.add
      .zone(OFFSET_X, 0, COLS * TILE, ROWS * TILE)
      .setOrigin(0, 0)
      .setDepth(5)
      .setInteractive(
        new Phaser.Geom.Rectangle(0, 0, COLS * TILE, ROWS * TILE),
        Phaser.Geom.Rectangle.Contains
      );
    gridZone.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      const gx = Math.floor((ptr.x - OFFSET_X) / TILE);
      const gy = Math.floor(ptr.y / TILE);
      this.handleGridCellClick(gx, gy);
    });
  }

  /** Обработка клика по ячейке сетки (выбор башни или постройка). Вызывается из Zone и из DOM-оверлея. */
  private handleGridCellClick(gx: number, gy: number): void {
    if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return;

    const towerHere = this.getTowerAt(gx, gy);
    if (towerHere) {
      this.selectedTower = towerHere;
      this.updateUpgradePanel();
      return;
    }

    if (!this.buildable[gy][gx]) return;
    this.selectedTower = null;
    this.updateUpgradePanel();
    const cost = ECONOMY.TOWER_BASE_COST;
    if (this.gold < cost) return;

    if (this.hasAntiSynergyLightningPoisonAt(gx, gy, this.selectedTowerType)) {
      this.showAntiSynergyWarning();
    }

    this.gold -= cost;
    this.buildable[gy][gx] = false;
    const tower = createTower(this, this.selectedTowerType, gx, gy, 1);
    this.towers.push(tower);
    this.updateHudText();
  }

  /** Проверка: есть ли рядом башня с элементом, дающим антисинергию ⚡+☠️. */
  private hasAntiSynergyLightningPoisonAt(gx: number, gy: number, element: Element): boolean {
    if (element !== 'LIGHTNING' && element !== 'POISON') return false;
    const other: Element = element === 'LIGHTNING' ? 'POISON' : 'LIGHTNING';
    const R = SYNERGY.CHECK_RADIUS;
    const grid = this.buildTowerGrid();
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        if (dx === 0 && dy === 0) continue;
        const ny = gy + dy;
        const nx = gx + dx;
        if (ny < 0 || ny >= ROWS || nx < 0 || nx >= COLS) continue;
        const t = grid[ny][nx];
        if (t && t.element === other) return true;
      }
    }
    return false;
  }

  /** Есть ли у башни сосед с антисинергией ⚡+☠️ (для штрафа урона). */
  private towerHasAntiSynergyLightningPoison(tower: BaseTower): boolean {
    const el = tower.towerData.element;
    if (el !== 'LIGHTNING' && el !== 'POISON') return false;
    return this.hasAntiSynergyLightningPoisonAt(tower.gridX, tower.gridY, el);
  }

  private showAntiSynergyWarning(): void {
    if (this.antiSynergyWarningText) {
      this.antiSynergyWarningText.destroy();
    }
    const lossPct = Math.round((SYNERGY.ANTI?.LIGHTNING_POISON_PENALTY ?? 0.7) * 100);
    this.antiSynergyWarningText = this.add
      .text(this.scale.width / 2, 120, `⚠ Антисинергия ⚡+☠️: эффективность −${lossPct}%`, {
        fontSize: '18px',
        color: '#ffaa00',
      })
      .setOrigin(0.5)
      .setDepth(25);
    this.time.delayedCall(2500, () => {
      const txt = this.antiSynergyWarningText;
      if (txt) {
        txt.destroy();
        this.antiSynergyWarningText = undefined;
      }
    });
  }

  /** Волна победы для текущего уровня (биом Лес 1–8). */
  private getWinAtWave(): number {
    const arr = GAME_DATA.WAVES?.WIN_AT_WAVE_BY_LEVEL;
    if (Array.isArray(arr) && arr[this.forestLevel - 1] != null) {
      return arr[this.forestLevel - 1];
    }
    return GAME_DATA.WAVES?.WIN_AT_WAVE ?? 10;
  }

  /** Переход на экран результата: через game.scene и setTimeout, чтобы смена сцены гарантированно сработала. */
  private goToResult(win: boolean, wave: number): void {
    if (this.transitioningToResult) return;
    this.transitioningToResult = true;
    const game = this.game;
    if (!game?.scene) {
      this.transitioningToResult = false;
      return;
    }
    const winVal = win;
    const waveVal = wave;
    const levelVal = this.forestLevel;
    setTimeout(() => {
      try {
        game.scene.start('Result', { win: winVal, wave: waveVal, level: levelVal });
      } catch (err) {
        console.error('goToResult error:', err);
        this.transitioningToResult = false;
      }
    }, 0);
  }

  private startNextWave(): void {
    this.waveNumber++;
    this.updateHudText();
    this.waveInProgress = true;
    this.waveHadEnemies = false;
    const list = spawnWave(this.waveNumber);
    if (list.length === 0) {
      this.waveHadEnemies = true;
      return;
    }
    const waypoints = this.waypoints;
    if (!waypoints.length) {
      this.waveHadEnemies = true;
      return;
    }
    const startX = waypoints[0].x;
    const startY = waypoints[0].y;
    // Разносим спавн по позициям вдоль пути (каждый следующий — чуть «сзади»), чтобы не было одного «босса» из стака
    const spawnStep = TILE * 0.6;
    for (let i = 0; i < list.length; i++) {
      try {
        const x = startX - i * spawnStep;
        const enemy = new BaseEnemy(this, x, startY, list[i], waypoints);
        this.enemies.push(enemy);
      } catch (err) {
        console.error('spawn enemy error:', err);
      }
    }
    this.waveHadEnemies = true;
  }

  private tick(deltaMs: number = 16): void {
    if (this.transitioningToResult || !this.scene.isActive() || this.paused) return;
    try {
      this.enemies.forEach((e) => {
        if (e.active) e.update(deltaMs);
      });

      const grid = this.buildTowerGrid();
      this.activeSynergies = this.synergySystem.update(grid, 'tick');
      this.drawSynergyLines();

      const toDestroy: BaseEnemy[] = [];
      this.enemies = this.enemies.filter((en) => {
        if (!en.active) {
          toDestroy.push(en);
          en.setVisible(false);
          return false;
        }
        if (!en.isAlive) {
          this.gold += en.currentReward;
          const burnEffect = this.getActiveSynergy('BURNING_BLOOD');
          if (burnEffect?.isActive && en.hasStatus('POISON')) {
            const cfg = SYNERGY.BURNING_BLOOD;
            const pct = (cfg.EXPLOSION_PERCENT_OF_MAX_HP ?? 1.5) / 100;
            const dmg = en.enemyData.maxHp * pct;
            const radiusPx = (cfg.EXPLOSION_RADIUS ?? 2) * TILE;
            this.dealAoeDamage(en.x, en.y, radiusPx, dmg);
          }
          toDestroy.push(en);
          en.setVisible(false);
          return false;
        }
        if (en.waypointIndex >= this.waypoints.length) {
          this.lives--;
          toDestroy.push(en);
          en.setVisible(false);
          return false;
        }
        return true;
      });
      for (const en of toDestroy) {
        en.setVisible(false);
        if ('removeFromDisplayList' in en && typeof (en as Phaser.GameObjects.GameObject).removeFromDisplayList === 'function') {
          (en as Phaser.GameObjects.GameObject).removeFromDisplayList();
        }
        en.destroy();
      }

      if (this.gold !== this.lastGold) {
        this.lastGold = this.gold;
        this.updateHudText();
      }
      if (this.lives !== this.lastLives) {
        this.lastLives = this.lives;
        this.updateHudText();
      }

      const now = typeof performance !== 'undefined' ? performance.now() : this.time.now;
      // Сначала собираем все выстрелы по текущему состоянию врагов — потом применяем урон.
      // Иначе первые башни "убивают" цель в том же кадре и остальные не находят цель.
      const shots: { tower: BaseTower; enemy: BaseEnemy }[] = [];
      for (const tower of this.towers) {
        if (!tower.active || !tower.canShoot(now)) continue;
        const nearest = this.getNearestEnemyInRange(tower);
        if (nearest && nearest.active && nearest.isAlive) shots.push({ tower, enemy: nearest });
      }
      for (const { tower, enemy } of shots) {
        tower.markShot(now);
        if (!enemy.active || !enemy.isAlive) continue;
        const el = tower.towerData.element;
        let dmg = tower.damage;

        const thermoshock = this.getActiveSynergy('THERMOSHOCK');
        if (el === 'ICE' && enemy.hasStatus('HEATED') && thermoshock?.isActive) {
          const cfg = SYNERGY.THERMOSHOCK;
          const baseDmg = GAME_DATA.TOWER.DAMAGE * (cfg.AOE_MULTIPLIER ?? 2.5);
          const radiusPx = (cfg.AOE_RADIUS ?? 3) * TILE;
          this.dealAoeDamage(enemy.x, enemy.y, radiusPx, baseDmg);
          enemy.removeStatus('HEATED');
          this.synergySystem.startCooldown(thermoshock, (cfg.COOLDOWN_SEC ?? 8) * 1000);
        }

        const electroshock = this.getActiveSynergy('ELECTROSHOCK');
        if (el === 'LIGHTNING' && enemy.hasStatus('FREEZE') && electroshock?.isActive) {
          const cfg = SYNERGY.ELECTROSHOCK;
          dmg *= cfg.DAMAGE_MULTIPLIER ?? 3;
          const chainDmg = dmg * 0.5;
          const radiusPx = 80;
          const nearby = this.getEnemiesInRadius(enemy.x, enemy.y, radiusPx).filter((e) => e !== enemy);
          for (let i = 0; i < Math.min(cfg.CHAIN_TARGETS ?? 4, nearby.length); i++) {
            if (nearby[i].active && nearby[i].isAlive) nearby[i].takeDamage(chainDmg);
          }
        }

        if ((el === 'LIGHTNING' || el === 'POISON') && this.towerHasAntiSynergyLightningPoison(tower)) {
          const penalty = SYNERGY.ANTI?.LIGHTNING_POISON_PENALTY ?? 0.7;
          dmg *= Math.max(0, 1 - penalty);
        }

        if (Number.isFinite(dmg) && dmg > 0) enemy.takeDamage(dmg, el);
      }

      if (this.lives <= 0) {
        this.goToResult(false, this.waveNumber);
        return;
      }

      // Волна завершена только когда в ней уже были враги и все убиты (не срабатывает до первого спавна)
      if (this.enemies.length === 0 && this.waveInProgress && this.waveHadEnemies) {
        this.waveInProgress = false;
        this.gold += ECONOMY.WAVE_CLEAR_BONUS;
        this.lastGold = this.gold;
        this.updateHudText();
        const towersSnapshot = this.towers
          .filter((t) => t.active)
          .map((t) => ({ element: t.towerData.element, level: t.towerData.level }));
        saveProgressAfterWave(this.gold, this.waveNumber, towersSnapshot).catch(() => {});
        const winAtWave = this.getWinAtWave();
        if (this.waveNumber >= winAtWave) {
          this.goToResult(true, this.waveNumber);
          return;
        }
        this.time.delayedCall(2500, () => this.startNextWave());
      }
    } catch (err) {
      console.error('GameScene.tick error:', err);
    }
  }

  /** Невидимый враг доступен как цель только если его «подсвечивает» башня LIGHT. */
  private isEnemyRevealed(enemy: BaseEnemy): boolean {
    if (enemy.enemyData.type !== 'INVISIBLE') return true;
    for (const t of this.towers) {
      if (!t.active || t.towerData.element !== 'LIGHT') continue;
      const rangePx = Number(t.rangePx);
      if (!Number.isFinite(rangePx) || rangePx <= 0) continue;
      const tx = OFFSET_X + (t.gridX + 0.5) * TILE;
      const ty = (t.gridY + 0.5) * TILE;
      if (Phaser.Math.Distance.Between(tx, ty, enemy.x, enemy.y) <= rangePx) return true;
    }
    return false;
  }

  private getNearestEnemyInRange(tower: BaseTower): BaseEnemy | null {
    const list = this.enemies.slice();
    if (!list.length) return null;
    const rangePx = Number(tower.rangePx);
    if (!Number.isFinite(rangePx) || rangePx <= 0) return null;

    const tx = OFFSET_X + (tower.gridX + 0.5) * TILE;
    const ty = (tower.gridY + 0.5) * TILE;

    let best: BaseEnemy | null = null;
    let bestDist = rangePx + 1;

    for (const e of list) {
      if (!e.active || !e.isAlive) continue;
      if (!this.isEnemyRevealed(e)) continue;
      const ex = e.x;
      const ey = e.y;
      if (!Number.isFinite(ex) || !Number.isFinite(ey)) continue;
      const d = Phaser.Math.Distance.Between(tx, ty, ex, ey);
      if (d <= rangePx && d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  private getPreviewColorForElement(el: Exclude<Element, 'NONE'>): number {
    const map: Record<Exclude<Element, 'NONE'>, number> = {
      FIRE: 0xdd4422,
      ICE: 0x44aaff,
      LIGHTNING: 0xdddd22,
      POISON: 0x88cc44,
      DARK: 0x442288,
      LIGHT: 0xffffaa,
      WIND: 0xaaffcc,
    };
    return map[el] ?? 0x88ff88;
  }

  private buildTowerGrid(): (Tower | null)[][] {
    const grid: (Tower | null)[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    for (const t of this.towers) {
      if (!t.active) continue;
      const gx = t.gridX;
      const gy = t.gridY;
      if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) grid[gy][gx] = t.towerData;
    }
    return grid;
  }

  private getActiveSynergy(type: SynergyEffect['type']): SynergyEffect | undefined {
    return this.activeSynergies.find((e) => e.type === type && e.isActive);
  }

  private dealAoeDamage(centerX: number, centerY: number, radiusPx: number, damage: number): void {
    for (const e of this.enemies) {
      if (!e.active || !e.isAlive) continue;
      const d = Phaser.Math.Distance.Between(centerX, centerY, e.x, e.y);
      if (d <= radiusPx) e.takeDamage(damage);
    }
  }

  private getEnemiesInRadius(x: number, y: number, radiusPx: number): BaseEnemy[] {
    return this.enemies.filter((e) => e.active && e.isAlive && Phaser.Math.Distance.Between(x, y, e.x, e.y) <= radiusPx);
  }

  private drawSynergyLines(): void {
    if (!this.synergyLines) this.synergyLines = this.add.graphics().setDepth(15);
    this.synergyLines.clear();
    for (const eff of this.activeSynergies) {
      if (eff.towers.length < 2 || !eff.isActive) continue;
      const [a, b] = eff.towers;
      const x1 = OFFSET_X + (a.position.x + 0.5) * TILE;
      const y1 = (a.position.y + 0.5) * TILE;
      const x2 = OFFSET_X + (b.position.x + 0.5) * TILE;
      const y2 = (b.position.y + 0.5) * TILE;
      this.synergyLines.lineStyle(2, 0x88ff88, 0.5);
      this.synergyLines.lineBetween(x1, y1, x2, y2);
    }
  }
}
