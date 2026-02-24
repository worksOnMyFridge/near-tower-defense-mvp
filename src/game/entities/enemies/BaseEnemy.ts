/**
 * Базовый класс врага. Движение по waypoints, получение урона.
 * Визуал — placeholder (круг/спрайт), в Фазе 1 добавляем Infantry, Armored, Fast, Flying, Invisible.
 */

import Phaser from 'phaser';
import type { Enemy as EnemyData, StatusEffect, Element } from '../../types';

export default class BaseEnemy extends Phaser.GameObjects.Container {
  /** Данные врага (не переименовывать в data — перекрывает Phaser.DataManager и ломает destroy()). */
  public readonly enemyData: EnemyData;
  private waypoints: { x: number; y: number }[] = [];
  public waypointIndex = 0;
  private hpBar?: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    data: EnemyData,
    waypoints: { x: number; y: number }[]
  ) {
    super(scene, x, y);
    this.enemyData = data;
    this.waypoints = waypoints;

    const isBoss = data.type === 'BOSS';
    const radius = isBoss ? 18 : 12;
    const color = isBoss ? 0xaa2222 : 0xcc4444;
    const body = scene.add.circle(0, 0, radius, color);
    this.add(body);

    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.drawHpBar();

    scene.add.existing(this);
  }

  private drawHpBar(): void {
    const bar = this.hpBar;
    if (!bar) return;
    bar.clear();
    const w = 24;
    const h = 4;
    bar.fillStyle(0x333333, 1);
    bar.fillRect(-w / 2, -20, w, h);
    const maxHp = this.enemyData.maxHp;
    if (!maxHp || !Number.isFinite(maxHp)) return;
    const pct = Math.max(0, Math.min(1, this.enemyData.hp / maxHp));
    bar.fillStyle(pct > 0.5 ? 0x44aa44 : pct > 0.25 ? 0xcccc44 : 0xcc4444, 1);
    bar.fillRect(-w / 2, -20, w * pct, h);
  }

  /** Длительности статусов от башен по умолчанию (мс). */
  private static readonly STATUS_DURATION: Partial<Record<Element, { type: StatusEffect['type']; durationMs: number }>> = {
    FIRE: { type: 'HEATED', durationMs: 2000 },
    ICE: { type: 'FREEZE', durationMs: 1200 },
    POISON: { type: 'POISON', durationMs: 4000 },
  };

  takeDamage(amount: number, sourceElement?: Element): void {
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (sourceElement && BaseEnemy.STATUS_DURATION[sourceElement]) {
      const immune = this.enemyData.immunities?.includes(sourceElement);
      if (!immune) {
        const { type, durationMs } = BaseEnemy.STATUS_DURATION[sourceElement];
        this.addStatus(type, 1, durationMs);
      }
    }
    this.enemyData.hp = Math.max(0, this.enemyData.hp - amount);
    if (this.enemyData.hp <= 0) this.setVisible(false);
    this.drawHpBar();
  }

  addStatus(type: StatusEffect['type'], value: number, durationMs: number): void {
    const existing = this.enemyData.statusEffects.find((s) => s.type === type);
    if (existing) {
      existing.value = value;
      existing.duration = durationMs;
    } else {
      this.enemyData.statusEffects.push({ type, value, duration: durationMs, source: null });
    }
  }

  hasStatus(type: StatusEffect['type']): boolean {
    return this.enemyData.statusEffects.some((s) => s.type === type);
  }

  removeStatus(type: StatusEffect['type']): void {
    this.enemyData.statusEffects = this.enemyData.statusEffects.filter((s) => s.type !== type);
  }

  tickStatuses(deltaMs: number): void {
    this.enemyData.statusEffects = this.enemyData.statusEffects.filter((s) => {
      s.duration -= deltaMs;
      return s.duration > 0;
    });
  }

  get isAlive(): boolean {
    return this.enemyData.hp > 0;
  }

  get currentReward(): number {
    return this.enemyData.reward;
  }

  update(deltaMs: number = 16): void {
    this.tickStatuses(deltaMs);
    if (this.waypointIndex >= this.waypoints.length) return;
    const target = this.waypoints[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = this.enemyData.speed * 0.016; // ~60 fps
    if (dist <= step) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }
}
