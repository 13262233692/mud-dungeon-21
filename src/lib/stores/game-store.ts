import { writable, derived, get } from 'svelte/store';
import type { Entity, Item, Player, GameMap } from '@shared/types';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '@shared/types';

interface GameState {
  connected: boolean;
  authenticated: boolean;
  playerId: string | null;
  player: Player | null;
  map: GameMap | null;
  entities: Entity[];
  items: Item[];
  logs: { message: string; level: string; timestamp: number }[];
  inCombat: boolean;
  combatEnemy: Entity | null;
  playerList: { id: string; name: string; level: number }[];
}

function createGameStore() {
  const { subscribe, set, update } = writable<GameState>({
    connected: false,
    authenticated: false,
    playerId: null,
    player: null,
    map: null,
    entities: [],
    items: [],
    logs: [],
    inCombat: false,
    combatEnemy: null,
    playerList: [],
  });

  return {
    subscribe,
    setConnected: (connected: boolean) =>
      update((s) => ({ ...s, connected })),
    setAuthenticated: (playerId: string) =>
      update((s) => ({ ...s, authenticated: true, playerId })),
    setPlayer: (player: Player) =>
      update((s) => ({ ...s, player })),
    setMap: (map: GameMap) =>
      update((s) => ({ ...s, map })),
    setEntities: (entities: Entity[]) =>
      update((s) => ({ ...s, entities })),
    setItems: (items: Item[]) =>
      update((s) => ({ ...s, items })),
    addLog: (message: string, level: string) =>
      update((s) => ({
        ...s,
        logs: [...s.logs.slice(-100), { message, level, timestamp: Date.now() }],
      })),
    setCombat: (enemy: Entity | null) =>
      update((s) => ({ ...s, inCombat: enemy !== null, combatEnemy: enemy })),
    setPlayerList: (players: { id: string; name: string; level: number }[]) =>
      update((s) => ({ ...s, playerList: players })),
    updateEntity: (entity: Entity) =>
      update((s) => {
        if (s.player && entity.id === s.player.id) {
          return { ...s, player: { ...s.player, ...entity } as Player };
        }
        const idx = s.entities.findIndex((e) => e.id === entity.id);
        const newEntities = [...s.entities];
        if (idx >= 0) {
          newEntities[idx] = entity;
        } else {
          newEntities.push(entity);
        }
        return { ...s, entities: newEntities };
      }),
    removeEntity: (entityId: string) =>
      update((s) => ({
        ...s,
        entities: s.entities.filter((e) => e.id !== entityId),
        inCombat: s.combatEnemy?.id === entityId ? false : s.inCombat,
        combatEnemy: s.combatEnemy?.id === entityId ? null : s.combatEnemy,
      })),
    addItem: (item: Item) =>
      update((s) => {
        if (!s.items.find((i) => i.id === item.id)) {
          return { ...s, items: [...s.items, item] };
        }
        return s;
      }),
    removeItem: (itemId: string) =>
      update((s) => ({ ...s, items: s.items.filter((i) => i.id !== itemId) })),
    reset: () =>
      set({
        connected: false,
        authenticated: false,
        playerId: null,
        player: null,
        map: null,
        entities: [],
        items: [],
        logs: [],
        inCombat: false,
        combatEnemy: null,
        playerList: [],
      }),
  };
}

export const gameStore = createGameStore();

export const playerPosition = derived(gameStore, ($s) => ({
  x: $s.player?.x ?? 0,
  y: $s.player?.y ?? 0,
}));
