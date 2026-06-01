import type { Direction, Entity } from '../../shared/types.js';
import { GameState } from '../state/game-state.js';
import { CombatSystem } from './combat-system.js';
import { ItemSystem } from './item-system.js';

const DIRECTION_DELTA: Record<Direction, { dx: number; dy: number }> = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  east: { dx: 1, dy: 0 },
  west: { dx: -1, dy: 0 },
};

export interface GameCommand {
  playerId: string;
  action: string;
  params: Record<string, unknown>;
}

export interface CommandResult {
  type: string;
  payload: Record<string, unknown>;
  broadcast?: { type: string; payload: Record<string, unknown> };
}

export class GameEngine {
  state: GameState;
  combat: CombatSystem;
  items: ItemSystem;

  constructor() {
    this.state = new GameState();
    this.combat = new CombatSystem(this.state);
    this.items = new ItemSystem(this.state);
  }

  execute(cmd: GameCommand): CommandResult[] {
    const results: CommandResult[] = [];
    const player = this.state.players.get(cmd.playerId);
    if (!player) {
      return [{ type: 'error', payload: { message: '玩家不存在' } }];
    }

    switch (cmd.action) {
      case 'move': {
        const dir = cmd.params['direction'] as Direction | undefined;
        if (!dir) {
          results.push({ type: 'error', payload: { message: '未知方向' } });
          break;
        }
        const delta = DIRECTION_DELTA[dir];
        if (!delta) {
          results.push({ type: 'error', payload: { message: '无效方向' } });
          break;
        }
        const moved = this.state.moveEntity(cmd.playerId, delta.dx, delta.dy);
        if (moved) {
          results.push({
            type: 'move_ok',
            payload: { x: player.x, y: player.y, direction: dir },
            broadcast: { type: 'entity_update', payload: { entity: this.sanitizeEntity(player) } },
          });

          const itemsHere = this.state.getItemsAt(player.x, player.y);
          if (itemsHere.length > 0) {
            results.push({
              type: 'items_nearby',
              payload: { items: itemsHere },
            });
          }

          const aggroTarget = this.combat.checkAggro(player);
          if (aggroTarget) {
            results.push({
              type: 'combat_start',
              payload: { enemy: this.sanitizeEntity(aggroTarget) },
            });
          }
        } else {
          const nx = player.x + delta.dx;
          const ny = player.y + delta.dy;
          const blocking = this.state.getEntityAt(nx, ny);
          if (blocking && blocking.type === 'monster') {
            results.push({
              type: 'combat_start',
              payload: { enemy: this.sanitizeEntity(blocking) },
            });
          } else {
            results.push({ type: 'move_fail', payload: { message: '无法移动到该位置' } });
          }
        }
        break;
      }

      case 'attack': {
        const targetId = cmd.params['targetId'] as string | undefined;
        if (!targetId) {
          results.push({ type: 'error', payload: { message: '请指定攻击目标' } });
          break;
        }

        let actualTargetId = targetId;
        if (targetId === 'nearest') {
          for (const entity of this.state.entities.values()) {
            if (entity.type === 'monster' && Math.abs(entity.x - player.x) <= 1 && Math.abs(entity.y - player.y) <= 1) {
              actualTargetId = entity.id;
              break;
            }
          }
        }

        const combatResult = this.combat.playerAttack(player, actualTargetId);
        if (combatResult) {
          results.push({
            type: 'combat_result',
            payload: combatResult as unknown as Record<string, unknown>,
          });
          if (combatResult.enemyDead) {
            results.push({
              type: 'log',
              payload: { message: `你击败了怪物！获得 ${combatResult.expGained} 经验`, level: 'combat' },
            });
            if (combatResult.loot) {
              results.push({
                type: 'log',
                payload: { message: `掉落了 ${combatResult.loot.name}`, level: 'loot' },
              });
            }
            results.push({
              type: 'entity_update',
              payload: { entity: this.sanitizeEntity(player) },
              broadcast: { type: 'entity_update', payload: { entity: this.sanitizeEntity(player) } },
            });
          }
          if (player.hp <= 0) {
            results.push({
              type: 'player_death',
              payload: { message: '你被击败了！将在起点重生...' },
            });
          }
        } else {
          results.push({ type: 'error', payload: { message: '无法攻击该目标' } });
        }
        break;
      }

      case 'pick': {
        const itemId = (cmd.params['itemId'] as string) || 'nearest';
        const pickupResult = this.items.pickupItem(player, itemId);
        if (pickupResult) {
          if (pickupResult.success) {
            results.push({
              type: 'item_pickup',
              payload: { item: pickupResult.item, success: true },
            });
            if (pickupResult.item.type === 'gold') {
              results.push({
                type: 'log',
                payload: { message: `拾取了 ${pickupResult.item.value} 金币`, level: 'loot' },
              });
            } else {
              results.push({
                type: 'log',
                payload: { message: `拾取了 ${pickupResult.item.name}`, level: 'loot' },
              });
            }
          } else {
            results.push({
              type: 'item_pickup',
              payload: { item: pickupResult.item, success: false },
            });
            results.push({
              type: 'log',
              payload: { message: '背包已满！', level: 'warn' },
            });
          }
        } else {
          results.push({ type: 'error', payload: { message: '这里没有可以拾取的物品' } });
        }
        break;
      }

      case 'use': {
        const itemId = (cmd.params['itemId'] as string) || '';
        const useResult = this.items.useItem(player, itemId);
        if (useResult) {
          results.push({
            type: 'item_use',
            payload: { item: useResult.item, effect: useResult.effect },
          });
          results.push({
            type: 'log',
            payload: { message: `使用了 ${useResult.item.name}`, level: 'info' },
          });
          results.push({
            type: 'entity_update',
            payload: { entity: this.sanitizeEntity(player) },
          });
        } else {
          results.push({ type: 'error', payload: { message: '无法使用该物品' } });
        }
        break;
      }

      case 'drop': {
        const itemId = (cmd.params['itemId'] as string) || '';
        const dropResult = this.items.dropItem(player, itemId);
        if (dropResult) {
          results.push({
            type: 'item_drop',
            payload: { item: dropResult },
          });
          results.push({
            type: 'log',
            payload: { message: `丢弃了 ${dropResult.name}`, level: 'info' },
          });
        } else {
          results.push({ type: 'error', payload: { message: '无法丢弃该物品' } });
        }
        break;
      }

      case 'look': {
        const visibleEntities = this.state.getVisibleEntities(cmd.playerId);
        const visibleItems = this.state.getVisibleItems(cmd.playerId);
        const tileType = this.state.map.tiles[player.y]?.[player.x] ?? 1;
        results.push({
          type: 'look_result',
          payload: {
            x: player.x,
            y: player.y,
            tile: tileType,
            entities: visibleEntities,
            items: visibleItems,
          },
        });
        break;
      }

      case 'inventory':
      case 'status': {
        results.push({
          type: 'player_status',
          payload: { player: this.sanitizePlayer(player) },
        });
        break;
      }

      case 'help': {
        results.push({
          type: 'log',
          payload: {
            message: '可用命令: move(n/s/e/w), attack, pick, use, drop, look, inventory, status, chat',
            level: 'info',
          },
        });
        break;
      }

      case 'chat': {
        const message = cmd.params['message'] as string | undefined;
        if (message) {
          results.push({
            type: 'chat',
            payload: { from: player.name, message },
            broadcast: { type: 'chat', payload: { from: player.name, message } },
          });
        }
        break;
      }

      case 'error': {
        results.push({
          type: 'error',
          payload: { message: (cmd.params['message'] as string) || '未知错误' },
        });
        break;
      }

      default:
        results.push({ type: 'error', payload: { message: `未知命令: ${cmd.action}` } });
    }

    return results;
  }

  private sanitizeEntity(entity: Entity): Record<string, unknown> {
    return {
      id: entity.id,
      type: entity.type,
      x: entity.x,
      y: entity.y,
      hp: entity.hp,
      maxHp: entity.maxHp,
      attack: entity.attack,
      defense: entity.defense,
      name: entity.name,
      sprite: entity.sprite,
    };
  }

  private sanitizePlayer(player: Player): Record<string, unknown> {
    return {
      ...this.sanitizeEntity(player),
      level: player.level,
      exp: player.exp,
      inventory: player.inventory,
      gold: player.gold,
      equipped: player.equipped,
    };
  }
}
