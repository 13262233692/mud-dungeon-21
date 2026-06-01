import type { GameMap, Entity, Item, Player, Monster } from '../../shared/types.js';
import { MAP_WIDTH, MAP_HEIGHT, TILE_FLOOR, TILE_WALL, TILE_DOOR, TILE_STAIRS, MONSTER_TEMPLATES, ITEM_TEMPLATES } from '../../shared/types.js';

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

let idCounter = 0;
function genId(prefix: string): string {
  idCounter++;
  return `${prefix}_${Date.now()}_${idCounter}`;
}

export class GameState {
  map: GameMap;
  entities: Map<string, Entity> = new Map();
  items: Map<string, Item> = new Map();
  players: Map<string, Player> = new Map();

  constructor() {
    this.map = this.generateMap();
    this.spawnMonsters();
    this.spawnItems();
  }

  private generateMap(): GameMap {
    const tiles: number[][] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      tiles[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        tiles[y][x] = TILE_WALL;
      }
    }

    const rooms: Room[] = [];
    const roomCount = 8 + Math.floor(Math.random() * 5);

    for (let i = 0; i < roomCount; i++) {
      const w = 5 + Math.floor(Math.random() * 6);
      const h = 5 + Math.floor(Math.random() * 6);
      const x = 2 + Math.floor(Math.random() * (MAP_WIDTH - w - 4));
      const y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - h - 4));

      let overlaps = false;
      for (const room of rooms) {
        if (
          x < room.x + room.w + 2 &&
          x + w + 2 > room.x &&
          y < room.y + room.h + 2 &&
          y + h + 2 > room.y
        ) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      rooms.push({ x, y, w, h });
      for (let ry = y; ry < y + h; ry++) {
        for (let rx = x; rx < x + w; rx++) {
          tiles[ry][rx] = TILE_FLOOR;
        }
      }
    }

    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1]!;
      const b = rooms[i]!;
      const ax = Math.floor(a.x + a.w / 2);
      const ay = Math.floor(a.y + a.h / 2);
      const bx = Math.floor(b.x + b.w / 2);
      const by = Math.floor(b.y + b.h / 2);

      let cx = ax;
      let cy = ay;
      while (cx !== bx) {
        tiles[cy]![cx] = TILE_FLOOR;
        cx += cx < bx ? 1 : -1;
      }
      while (cy !== by) {
        tiles[cy]![cx] = TILE_FLOOR;
        cy += cy < by ? 1 : -1;
      }
    }

    if (rooms.length > 2) {
      const lastRoom = rooms[rooms.length - 1]!;
      const sx = Math.floor(lastRoom.x + lastRoom.w / 2);
      const sy = Math.floor(lastRoom.y + lastRoom.h / 2);
      tiles[sy]![sx] = TILE_STAIRS;
    }

    for (const room of rooms) {
      if (Math.random() < 0.4) {
        const dx = room.x + Math.floor(Math.random() * room.w);
        const dy = room.y;
        tiles[dy]![dx] = TILE_DOOR;
      }
      if (Math.random() < 0.4) {
        const dx = room.x + Math.floor(Math.random() * room.w);
        const dy = room.y + room.h - 1;
        tiles[dy]![dx] = TILE_DOOR;
      }
    }

    return { width: MAP_WIDTH, height: MAP_HEIGHT, tiles, rooms };
  }

  private spawnMonsters(): void {
    for (const room of this.map.rooms) {
      const monsterCount = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < monsterCount; i++) {
        const tIdx = Math.floor(Math.random() * MONSTER_TEMPLATES.length);
        const mx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const my = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        this.spawnMonster(mx, my, tIdx);
      }
    }
  }

  spawnMonster(x: number, y: number, templateIdx: number): Monster {
    const tmpl = MONSTER_TEMPLATES[templateIdx]!;
    const monster: Monster = {
      id: genId('mob'),
      type: 'monster',
      x,
      y,
      hp: tmpl.maxHp,
      maxHp: tmpl.maxHp,
      attack: tmpl.attack,
      defense: tmpl.defense,
      name: tmpl.name,
      sprite: tmpl.sprite,
      expReward: tmpl.expReward,
      lootTable: tmpl.lootTable,
      aggressive: tmpl.aggressive,
    };
    this.entities.set(monster.id, monster);
    return monster;
  }

  private spawnItems(): void {
    for (const room of this.map.rooms) {
      const itemCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < itemCount; i++) {
        const tIdx = Math.floor(Math.random() * ITEM_TEMPLATES.length);
        const ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        this.spawnItem(ix, iy, tIdx);
      }
    }
  }

  spawnItem(x: number, y: number, templateIdx: number): Item {
    const tmpl = ITEM_TEMPLATES[templateIdx]!;
    const item: Item = {
      id: genId('item'),
      name: tmpl.name,
      type: tmpl.type,
      x,
      y,
      value: tmpl.value,
      sprite: tmpl.sprite,
      effect: tmpl.effect ? { ...tmpl.effect } : undefined,
    };
    this.items.set(item.id, item);
    return item;
  }

  addPlayer(name: string, mode: 'player' | 'observer'): Player {
    const room = this.map.rooms[0];
    const startX = room ? Math.floor(room.x + room.w / 2) : 5;
    const startY = room ? Math.floor(room.y + room.h / 2) : 5;

    const explored: boolean[][] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      explored[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        explored[y]![x] = false;
      }
    }

    const player: Player = {
      id: genId('player'),
      type: 'player',
      x: startX,
      y: startY,
      hp: 100,
      maxHp: 100,
      attack: 5,
      defense: 2,
      name,
      sprite: mode === 'observer' ? '👁️' : '🧑',
      level: 1,
      exp: 0,
      inventory: [],
      gold: 0,
      equipped: {},
      explored,
    };

    this.revealAround(player, startX, startY);
    this.players.set(player.id, player);
    this.entities.set(player.id, player);
    return player;
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    this.entities.delete(playerId);
  }

  isPassable(x: number, y: number): boolean {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    const tile = this.map.tiles[y]?.[x];
    return tile === TILE_FLOOR || tile === TILE_DOOR || tile === TILE_STAIRS;
  }

  moveEntity(entityId: string, dx: number, dy: number): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;
    const nx = entity.x + dx;
    const ny = entity.y + dy;
    if (!this.isPassable(nx, ny)) return false;

    const occupant = this.getEntityAt(nx, ny);
    if (occupant && occupant.id !== entityId) return false;

    entity.x = nx;
    entity.y = ny;

    if (entity.type === 'player') {
      const player = this.players.get(entityId);
      if (player) {
        this.revealAround(player, nx, ny);
      }
    }

    return true;
  }

  getEntityAt(x: number, y: number): Entity | undefined {
    for (const entity of this.entities.values()) {
      if (entity.x === x && entity.y === y) {
        return entity;
      }
    }
    return undefined;
  }

  getItemsAt(x: number, y: number): Item[] {
    const result: Item[] = [];
    for (const item of this.items.values()) {
      if (item.x === x && item.y === y) {
        result.push(item);
      }
    }
    return result;
  }

  removeItem(itemId: string): void {
    this.items.delete(itemId);
  }

  revealAround(player: Player, cx: number, cy: number): void {
    const radius = 5;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
          if (dx * dx + dy * dy <= radius * radius) {
            player.explored[y]![x] = true;
          }
        }
      }
    }
  }

  getVisibleEntities(playerId: string): Entity[] {
    const player = this.players.get(playerId);
    if (!player) return [];
    const result: Entity[] = [];
    const radius = 7;
    for (const entity of this.entities.values()) {
      const dx = entity.x - player.x;
      const dy = entity.y - player.y;
      if (dx * dx + dy * dy <= radius * radius) {
        result.push(entity);
      }
    }
    return result;
  }

  getVisibleItems(playerId: string): Item[] {
    const player = this.players.get(playerId);
    if (!player) return [];
    const result: Item[] = [];
    const radius = 7;
    for (const item of this.items.values()) {
      const dx = item.x - player.x;
      const dy = item.y - player.y;
      if (dx * dx + dy * dy <= radius * radius) {
        result.push(item);
      }
    }
    return result;
  }
}
