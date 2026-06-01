import type { Player, Item } from '../../shared/types.js';
import type { GameState } from '../state/game-state.js';

export class ItemSystem {
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  pickupItem(player: Player, itemId: string): { item: Item; success: boolean } | null {
    let targetItem: Item | undefined;

    if (itemId === 'nearest') {
      const itemsHere = this.state.getItemsAt(player.x, player.y);
      targetItem = itemsHere[0];
    } else {
      targetItem = this.state.items.get(itemId);
      if (targetItem && (targetItem.x !== player.x || targetItem.y !== player.y)) {
        const nearby = this.state.getItemsAt(player.x, player.y);
        targetItem = nearby.find(i => i.id === itemId || i.name.toLowerCase().includes(itemId));
      }
    }

    if (!targetItem) return null;
    if (targetItem.x !== player.x || targetItem.y !== player.y) return null;

    if (player.inventory.length >= 16) {
      return { item: targetItem, success: false };
    }

    this.state.removeItem(targetItem.id);
    targetItem.x = -1;
    targetItem.y = -1;

    if (targetItem.type === 'gold') {
      player.gold += targetItem.value;
      return { item: targetItem, success: true };
    }

    player.inventory.push(targetItem);
    return { item: targetItem, success: true };
  }

  useItem(player: Player, itemId: string): { item: Item; effect?: { stat: string; amount: number } } | null {
    const idx = player.inventory.findIndex(i => i.id === itemId || i.name.toLowerCase().includes(itemId));
    if (idx === -1) return null;

    const item = player.inventory[idx]!;

    switch (item.type) {
      case 'potion': {
        if (item.effect) {
          if (item.effect.stat === 'hp') {
            player.hp = Math.min(player.maxHp, player.hp + item.effect.amount);
          }
        }
        player.inventory.splice(idx, 1);
        return { item, effect: item.effect };
      }
      case 'weapon': {
        if (player.equipped.weapon) {
          const old = player.equipped.weapon;
          player.inventory.push(old);
          player.attack -= old.effect?.amount ?? 0;
        }
        player.equipped.weapon = item;
        player.inventory.splice(idx, 1);
        if (item.effect) {
          player.attack += item.effect.amount;
        }
        return { item };
      }
      case 'armor': {
        if (player.equipped.armor) {
          const old = player.equipped.armor;
          player.inventory.push(old);
          player.defense -= old.effect?.amount ?? 0;
        }
        player.equipped.armor = item;
        player.inventory.splice(idx, 1);
        if (item.effect) {
          player.defense += item.effect.amount;
        }
        return { item };
      }
      default:
        return null;
    }
  }

  dropItem(player: Player, itemId: string): Item | null {
    const idx = player.inventory.findIndex(i => i.id === itemId || i.name.toLowerCase().includes(itemId));
    if (idx === -1) return null;

    const item = player.inventory[idx]!;
    player.inventory.splice(idx, 1);
    item.x = player.x;
    item.y = player.y;
    this.state.items.set(item.id, item);
    return item;
  }
}
