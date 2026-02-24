/**
 * Игровые типы — @see docs/TZ.md раздел 4
 */

export type Element =
  | 'FIRE'
  | 'ICE'
  | 'LIGHTNING'
  | 'POISON'
  | 'DARK'
  | 'LIGHT'
  | 'WIND'
  | 'NONE';

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type TargetPriority =
  | 'FIRST'
  | 'LAST'
  | 'STRONGEST'
  | 'WEAKEST'
  | 'NEAREST';

export type EnemyType =
  | 'INFANTRY'
  | 'ARMORED'
  | 'FAST'
  | 'FLYING'
  | 'INVISIBLE'
  | 'REGENERATOR'
  | 'UNDEAD'
  | 'ELITE'
  | 'BOSS';

export type SynergyType =
  | 'THERMOSHOCK'
  | 'ELECTROSHOCK'
  | 'BURNING_BLOOD'
  | 'ECLIPSE'
  | 'BALL_LIGHTNING'
  | 'NECROSIS'
  | 'SOLAR_WIND'
  | 'TOXIC_VORTEX'
  | 'DARK_STORM'
  | 'PLASMA'
  | 'BLACK_PLAGUE';

export interface Tower {
  id: string;
  element: Element;
  level: number; // 1–3, NFT Legendary: 1–4
  position: { x: number; y: number };
  targetPriority: TargetPriority;
  isNFT: boolean;
  nftData?: NFTData;
  artifact?: Artifact; // Фаза 3
}

export interface NFTData {
  tokenId: string;
  contractId: string;
  rarity: Rarity;
  collectionName: string;
  element: Element;
  skills: string[];
}

export interface Enemy {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  immunities: Element[];
  reward: number;
  statusEffects: StatusEffect[];
}

export interface StatusEffect {
  type: 'SLOW' | 'POISON' | 'BURN' | 'FREEZE' | 'ARMOR_BREAK' | 'HEATED';
  value: number;
  duration: number;
  source: SynergyType | null;
}

export interface SynergyEffect {
  type: SynergyType;
  towers: Tower[];
  isActive: boolean;
  cooldownRemaining: number;
}

export interface Artifact {
  id: string;
  nftId: string;
  type: 'SYNERGY_MOD' | 'BEHAVIOR_MOD' | 'MAP_KEY';
  rarity: Rarity;
  equippedTowerId: string | null;
}
