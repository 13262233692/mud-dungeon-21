import type { MudMessage, Direction } from '../../shared/types.js';

export interface ParsedCommand {
  action: string;
  params: Record<string, unknown>;
}

const DIRECTION_MAP: Record<string, Direction> = {
  north: 'north',
  n: 'north',
  south: 'south',
  s: 'south',
  east: 'east',
  e: 'east',
  west: 'west',
  w: 'west',
  up: 'north',
  down: 'south',
  left: 'west',
  right: 'east',
};

export class MudParser {
  parse(raw: string): ParsedCommand | null {
    let msg: MudMessage;
    try {
      msg = JSON.parse(raw) as MudMessage;
    } catch {
      return this.parseTextCommand(raw.trim());
    }

    if (!msg.type) return null;
    return { action: msg.type, params: msg.payload ?? {} };
  }

  private parseTextCommand(text: string): ParsedCommand | null {
    const parts = text.toLowerCase().split(/\s+/);
    const cmd = parts[0];
    if (!cmd) return null;

    if (DIRECTION_MAP[cmd]) {
      return { action: 'move', params: { direction: DIRECTION_MAP[cmd] } };
    }

    switch (cmd) {
      case 'go':
      case 'move':
      case 'walk': {
        const dir = parts[1];
        if (dir && DIRECTION_MAP[dir]) {
          return { action: 'move', params: { direction: DIRECTION_MAP[dir] } };
        }
        return { action: 'error', params: { message: '未知方向。可用: north/south/east/west' } };
      }
      case 'attack':
      case 'hit':
      case 'fight':
      case 'kill': {
        const targetId = parts.slice(1).join(' ');
        if (targetId) {
          return { action: 'attack', params: { targetId } };
        }
        return { action: 'error', params: { message: '请指定攻击目标' } };
      }
      case 'pick':
      case 'get':
      case 'take':
      case 'grab': {
        const itemId = parts.slice(1).join(' ');
        if (itemId) {
          return { action: 'pick', params: { itemId } };
        }
        return { action: 'pick', params: { itemId: 'nearest' } };
      }
      case 'use':
      case 'drink':
      case 'equip': {
        const itemId = parts.slice(1).join(' ');
        return { action: 'use', params: { itemId } };
      }
      case 'drop':
      case 'discard': {
        const itemId = parts.slice(1).join(' ');
        return { action: 'drop', params: { itemId } };
      }
      case 'look':
      case 'l':
      case 'examine':
        return { action: 'look', params: {} };
      case 'inventory':
      case 'inv':
      case 'i':
      case 'bag':
        return { action: 'inventory', params: {} };
      case 'chat':
      case 'say':
      case 'tell': {
        const message = parts.slice(1).join(' ');
        return { action: 'chat', params: { message } };
      }
      case 'help':
      case '?':
        return { action: 'help', params: {} };
      case 'status':
      case 'stats':
      case 'hp':
        return { action: 'status', params: {} };
      default:
        return { action: 'chat', params: { message: text } };
    }
  }

  serialize(type: string, payload: Record<string, unknown>): string {
    return JSON.stringify({ type, payload });
  }
}
