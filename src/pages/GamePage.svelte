<script lang="ts">
  import { MudClient } from '../lib/protocol/mud-client.js';
  import { gameStore } from '../lib/stores/game-store.js';
  import GameCanvas from '../components/GameCanvas.svelte';
  import StatusBar from '../components/StatusBar.svelte';
  import Inventory from '../components/Inventory.svelte';
  import CombatPanel from '../components/CombatPanel.svelte';
  import EventLog from '../components/EventLog.svelte';
  import ChatInput from '../components/ChatInput.svelte';

  let client: MudClient | null = null;
  let sidebarOpen = $state(true);

  function initClient() {
    client = new MudClient();

    client.onMessage((type, payload) => {
      switch (type) {
        case 'map_data':
          gameStore.setMap(payload as any);
          break;
        case 'player_status':
          gameStore.setPlayer(payload['player'] as any);
          break;
        case 'state_sync':
          gameStore.setEntities((payload['entities'] as any[]) || []);
          gameStore.setItems((payload['items'] as any[]) || []);
          break;
        case 'entity_update':
          gameStore.updateEntity(payload['entity'] as any);
          break;
        case 'combat_start':
          gameStore.setCombat(payload['enemy'] as any);
          break;
        case 'combat_result': {
          if (payload['enemyDead']) {
            const enemyId = gameStore.combatEnemy?.id;
            if (enemyId) gameStore.removeEntity(enemyId);
            gameStore.setCombat(null);
          }
          if (payload['playerHp'] !== undefined) {
            gameStore.update((s) => {
              if (s.player) {
                s.player.hp = payload['playerHp'] as number;
              }
              return s;
            });
          }
          gameStore.addLog(
            `造成 ${(payload['damage'] as number) || 0} 点伤害` +
            (payload['enemyDead'] ? ' — 敌人被击败！' : ''),
            payload['enemyDead'] ? 'combat' : 'info'
          );
          if (payload['expGained']) {
            gameStore.addLog(`获得 ${payload['expGained']} 经验`, 'loot');
          }
          break;
        }
        case 'item_pickup': {
          if (payload['success']) {
            gameStore.removeItem(payload['item']?.['id'] as string);
            gameStore.update((s) => {
              if (s.player && payload['item']) {
                const item = payload['item'] as any;
                if (item.type === 'gold') {
                  s.player.gold += item.value;
                } else {
                  s.player.inventory = [...s.player.inventory, item];
                }
              }
              return s;
            });
          }
          break;
        }
        case 'item_use':
          gameStore.update((s) => {
            if (s.player) {
              s.player = { ...s.player, ...(payload as any) } as any;
            }
            return s;
          });
          break;
        case 'items_nearby':
          gameStore.setItems([...(payload['items'] as any[])]);
          break;
        case 'player_death':
          gameStore.addLog(payload['message'] as string, 'error');
          gameStore.setCombat(null);
          break;
        case 'log':
          gameStore.addLog(payload['message'] as string, payload['level'] as string || 'info');
          break;
        case 'chat':
          gameStore.addLog(`[${payload['from']}] ${payload['message']}`, 'info');
          break;
        case 'player_list':
          gameStore.setPlayerList(payload['players'] as any[]);
          break;
        case 'error':
          gameStore.addLog(payload['message'] as string, 'error');
          break;
        case 'move_ok':
          break;
        case 'disconnected':
          gameStore.setConnected(false);
          break;
      }
    });

    client.connect().then(() => {
      gameStore.setConnected(true);
      const stored = localStorage.getItem('mud_auth');
      if (stored) {
        const auth = JSON.parse(stored);
        client?.auth(auth.name, auth.mode);
      }
    });
  }

  function handleSendCommand(action: string, params: Record<string, unknown> = {}) {
    client?.send(action, params);
  }

  function handleChatSend(message: string) {
    client?.chat(message);
  }

  initClient();

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }
</script>

<div class="game-layout">
  <div class="game-main">
    <GameCanvas {client} oncommand={handleSendCommand} />
  </div>

  <div class="game-sidebar" class:collapsed={!sidebarOpen}>
    <button class="sidebar-toggle" onclick={toggleSidebar}>
      {sidebarOpen ? '▶' : '◀'}
    </button>

    {#if sidebarOpen}
      <div class="sidebar-content">
        <StatusBar />
        <Inventory onuse={(id) => handleSendCommand('use', { itemId: id })} ondrop={(id) => handleSendCommand('drop', { itemId: id })} />
        <EventLog />
        <ChatInput onsend={handleChatSend} />
      </div>
    {/if}
  </div>

  <CombatPanel {client} />
</div>

<style>
  .game-layout {
    display: flex;
    width: 100vw;
    height: 100vh;
    background: #0d0d1a;
    overflow: hidden;
  }

  .game-main {
    flex: 1;
    min-width: 0;
    position: relative;
  }

  .game-sidebar {
    width: 320px;
    min-width: 320px;
    background: var(--dungeon-panel, #16213e);
    border-left: 2px solid var(--dungeon-accent, #0f3460);
    display: flex;
    position: relative;
    transition: width 0.3s, min-width 0.3s;
  }

  .game-sidebar.collapsed {
    width: 30px;
    min-width: 30px;
  }

  .sidebar-toggle {
    position: absolute;
    left: -14px;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 48px;
    background: var(--dungeon-accent, #0f3460);
    border: 1px solid var(--dungeon-highlight, #e94560);
    border-radius: 4px 0 0 4px;
    color: #e0e0e0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    font-size: 10px;
  }

  .sidebar-toggle:hover {
    background: var(--dungeon-highlight, #e94560);
  }

  .sidebar-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
