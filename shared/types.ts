export interface Entity {
  id: string;
  type: 'player' | 'monster' | 'npc';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  name: string;
  sprite: string;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'key' | 'gold';
  x: number;
  y: number;
  value: number;
  sprite: string;
  effect?: { stat: string; amount: number };
}

export interface Player extends Entity {
  level: number;
  exp: number;
  inventory: Item[];
  gold: number;
  equipped: { weapon?: Item; armor?: Item };
  explored: boolean[][];
}

export interface Monster extends Entity {
  expReward: number;
  lootTable: { itemId: string; chance: number }[];
  aggressive: boolean;
}

export interface GameMap {
  width: number;
  height: number;
  tiles: number[][];
  rooms: { x: number; y: number; w: number; h: number }[];
}

export interface MudMessage {
  type: string;
  payload: Record<string, unknown>;
}

export type Direction = 'north' | 'south' | 'east' | 'west';
export type PlayerMode = 'player' | 'observer';

export interface AuthPayload {
  name: string;
  mode: PlayerMode;
}

export interface MovePayload {
  direction: Direction;
}

export interface AttackPayload {
  targetId: string;
}

export interface ItemPayload {
  itemId: string;
}

export interface ChatPayload {
  message: string;
}

export interface AuthOkPayload {
  playerId: string;
  x: number;
  y: number;
}

export interface AuthFailPayload {
  reason: string;
}

export interface MapDataPayload {
  width: number;
  height: number;
  tiles: number[][];
  rooms: { x: number; y: number; w: number; h: number }[];
}

export interface StateSyncPayload {
  entities: Entity[];
  items: Item[];
  players: Player[];
}

export interface EntityUpdatePayload {
  entity: Entity;
}

export interface CombatStartPayload {
  enemy: Entity;
}

export interface CombatResultPayload {
  damage: number;
  enemyHp: number;
  playerHp: number;
  enemyDead: boolean;
  expGained: number;
  loot?: Item;
}

export interface ItemPickupPayload {
  item: Item;
  success: boolean;
}

export interface LogPayload {
  message: string;
  level: 'info' | 'warn' | 'error' | 'combat' | 'loot';
}

export interface ChatMessagePayload {
  from: string;
  message: string;
}

export interface PlayerListPayload {
  players: { id: string; name: string; level: number }[];
}

export const TILE_FLOOR = 0;
export const TILE_WALL = 1;
export const TILE_DOOR = 2;
export const TILE_STAIRS = 3;
export const TILE_WATER = 4;
export const TILE_LAVA = 5;

export const TILE_SIZE = 32;

export const MAP_WIDTH = 50;
export const MAP_HEIGHT = 50;

export const MONSTER_TEMPLATES: Omit<Monster, 'id' | 'x' | 'y' | 'hp'>[] = [
  {
    type: 'monster',
    name: '史莱姆',
    maxHp: 20,
    attack: 3,
    defense: 1,
    sprite: '🟢',
    expReward: 10,
    lootTable: [{ itemId: 'potion_hp', chance: 0.3 }],
    aggressive: false,
  },
  {
    type: 'monster',
    name: '骷髅兵',
    maxHp: 35,
    attack: 7,
    defense: 3,
    sprite: '💀',
    expReward: 25,
    lootTable: [{ itemId: 'sword_iron', chance: 0.2 }, { itemId: 'potion_hp', chance: 0.5 }],
    aggressive: true,
  },
  {
    type: 'monster',
    name: '蝙蝠',
    maxHp: 15,
    attack: 5,
    defense: 0,
    sprite: '🦇',
    expReward: 8,
    lootTable: [],
    aggressive: false,
  },
  {
    type: 'monster',
    name: '暗影法师',
    maxHp: 45,
    attack: 12,
    defense: 2,
    sprite: '🧙',
    expReward: 40,
    lootTable: [{ itemId: 'staff_magic', chance: 0.15 }, { itemId: 'potion_mp', chance: 0.4 }],
    aggressive: true,
  },
  {
    type: 'monster',
    name: '地牢守卫',
    maxHp: 60,
    attack: 10,
    defense: 8,
    sprite: '👹',
    expReward: 50,
    lootTable: [{ itemId: 'armor_steel', chance: 0.2 }, { itemId: 'key_boss', chance: 0.05 }],
    aggressive: true,
  },
];

export const ITEM_TEMPLATES: Omit<Item, 'id' | 'x' | 'y'>[] = [
  {
    name: '生命药水',
    type: 'potion',
    value: 10,
    sprite: '❤️',
    effect: { stat: 'hp', amount: 20 },
  },
  {
    name: '魔力药水',
    type: 'potion',
    value: 15,
    sprite: '💙',
    effect: { stat: 'hp', amount: 15 },
  },
  {
    name: '铁剑',
    type: 'weapon',
    value: 30,
    sprite: '🗡️',
    effect: { stat: 'attack', amount: 5 },
  },
  {
    name: '魔法杖',
    type: 'weapon',
    value: 50,
    sprite: '🪄',
    effect: { stat: 'attack', amount: 8 },
  },
  {
    name: '钢甲',
    type: 'armor',
    value: 40,
    sprite: '🛡️',
    effect: { stat: 'defense', amount: 5 },
  },
  {
    name: '地牢钥匙',
    type: 'key',
    value: 100,
    sprite: '🔑',
  },
  {
    name: '金币袋',
    type: 'gold',
    value: 25,
    sprite: '💰',
  },
];
