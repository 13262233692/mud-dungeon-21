import type { Player, Monster, Item, Entity } from '../../shared/types.js';
import type { GameState } from '../state/game-state.js';
import { ITEM_TEMPLATES } from '../../shared/types.js';

export interface CombatResult {
  damage: number;
  enemyHp: number;
  playerHp: number;
  enemyDead: boolean;
  expGained: number;
  loot?: Item;
}

export class CombatSystem {
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  playerAttack(player: Player, targetId: string): CombatResult | null {
    const target = this.state.entities.get(targetId);
    if (!target || target.type !== 'monster') return null;

    const dx = Math.abs(target.x - player.x);
    const dy = Math.abs(target.y - player.y);
    if (dx > 1 || dy > 1) return null;

    const damage = this.calculateDamage(player.attack, target.defense);
    target.hp = Math.max(0, target.hp - damage);

    let loot: Item | undefined;
    let expGained = 0;
    let enemyDead = false;

    if (target.hp <= 0) {
      enemyDead = true;
      const monster = target as Monster;
      expGained = monster.expReward;
      loot = this.rollLoot(monster);
      this.state.entities.delete(targetId);
    } else {
      this.enemyRetaliate(target, player);
    }

    this.grantExp(player, expGained);

    return {
      damage,
      enemyHp: target.hp,
      playerHp: player.hp,
      enemyDead,
      expGained,
      loot,
    };
  }

  private calculateDamage(attack: number, defense: number): number {
    const baseDamage = Math.max(1, attack - defense);
    const variance = Math.floor(Math.random() * 3) - 1;
    return Math.max(1, baseDamage + variance);
  }

  private enemyRetaliate(enemy: Entity, player: Player): void {
    const damage = this.calculateDamage(enemy.attack, player.defense);
    player.hp = Math.max(0, player.hp - damage);

    if (player.hp <= 0) {
      this.handlePlayerDeath(player);
    }
  }

  private handlePlayerDeath(player: Player): void {
    const room = this.state.map.rooms[0];
    player.x = room ? Math.floor(room.x + room.w / 2) : 5;
    player.y = room ? Math.floor(room.y + room.h / 2) : 5;
    player.hp = player.maxHp;
    const goldLost = Math.floor(player.gold * 0.3);
    player.gold -= goldLost;
  }

  private rollLoot(monster: Monster): Item | undefined {
    for (const entry of monster.lootTable) {
      if (Math.random() < entry.chance) {
        const tmplIdx = ITEM_TEMPLATES.findIndex(t => t.name.toLowerCase().includes(entry.itemId.split('_')[0]!));
        if (tmplIdx >= 0) {
          return this.state.spawnItem(monster.x, monster.y, tmplIdx);
        }
      }
    }
    if (Math.random() < 0.2) {
      const goldIdx = ITEM_TEMPLATES.findIndex(t => t.type === 'gold');
      if (goldIdx >= 0) {
        return this.state.spawnItem(monster.x, monster.y, goldIdx);
      }
    }
    return undefined;
  }

  private grantExp(player: Player, exp: number): void {
    player.exp += exp;
    const expForLevel = player.level * 50;
    while (player.exp >= expForLevel) {
      player.exp -= expForLevel;
      player.level++;
      player.maxHp += 10;
      player.hp = Math.min(player.hp + 10, player.maxHp);
      player.attack += 2;
      player.defense += 1;
    }
  }

  checkAggro(player: Player): Entity | null {
    for (const entity of this.state.entities.values()) {
      if (entity.type !== 'monster') continue;
      const monster = entity as Monster;
      if (!monster.aggressive) continue;
      const dx = Math.abs(entity.x - player.x);
      const dy = Math.abs(entity.y - player.y);
      if (dx <= 2 && dy <= 2) {
        return entity;
      }
    }
    return null;
  }
}
