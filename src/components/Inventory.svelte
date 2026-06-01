<script lang="ts">
  import { gameStore } from '../lib/stores/game-store.js';

  let { onuse, ondrop }: { onuse: (id: string) => void; ondrop: (id: string) => void } = $props();

  let player = $derived($gameStore.player);
  let inventory = $derived(player?.inventory || []);
  let equipped = $derived(player?.equipped || {});

  let selectedItem = $state<Item | null>(null);

  function selectItem(item: any) {
    selectedItem = selectedItem?.id === item.id ? null : item;
  }
</script>

<div class="inventory-panel">
  <div class="panel-header">
    <span class="panel-title">🎒 背包</span>
    <span class="panel-count">{inventory.length}/16</span>
  </div>

  <div class="equipped-section">
    <div class="equip-label">装备</div>
    <div class="equip-slots">
      <div class="equip-slot" class:filled={!!equipped.weapon}>
        {#if equipped.weapon}
          <span class="equip-item" title="{(equipped.weapon as any).name} ⚔️+{(equipped.weapon as any).effect?.amount}">
            {(equipped.weapon as any).sprite}
          </span>
        {:else}
          <span class="empty-slot">⚔️</span>
        {/if}
        <span class="slot-label">武器</span>
      </div>
      <div class="equip-slot" class:filled={!!equipped.armor}>
        {#if equipped.armor}
          <span class="equip-item" title="{(equipped.armor as any).name} 🛡️+{(equipped.armor as any).effect?.amount}">
            {(equipped.armor as any).sprite}
          </span>
        {:else}
          <span class="empty-slot">🛡️</span>
        {/if}
        <span class="slot-label">护甲</span>
      </div>
    </div>
  </div>

  <div class="inventory-grid">
    {#each Array(16) as _, i}
      {#if inventory[i]}
        <div
          class="inv-slot"
          class:selected={selectedItem?.id === inventory[i].id}
          class:item-type-{inventory[i].type}
          onclick={() => selectItem(inventory[i])}
          title={inventory[i].name}
        >
          <span class="inv-sprite">{inventory[i].sprite}</span>
        </div>
      {:else}
        <div class="inv-slot empty"></div>
      {/if}
    {/each}
  </div>

  {#if selectedItem}
    <div class="item-actions">
      <div class="item-info">
        <span class="item-sprite">{selectedItem.sprite}</span>
        <span class="item-name">{selectedItem.name}</span>
      </div>
      <div class="action-buttons">
        <button class="action-btn use-btn" onclick={() => onuse(selectedItem!.id)}>
          {selectedItem.type === 'potion' ? '🍷 使用' : selectedItem.type === 'weapon' ? '⚔️ 装备' : selectedItem.type === 'armor' ? '🛡️ 装备' : '✋ 使用'}
        </button>
        <button class="action-btn drop-btn" onclick={() => { ondrop(selectedItem!.id); selectedItem = null; }}>
          🗑️ 丢弃
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .inventory-panel {
    padding: 12px 16px;
    border-bottom: 1px solid #0f3460;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .panel-title {
    font-family: 'Press Start 2P', cursive;
    font-size: 9px;
    color: #f5c518;
  }

  .panel-count {
    font-size: 10px;
    color: #8888aa;
  }

  .equipped-section {
    margin-bottom: 10px;
  }

  .equip-label {
    font-size: 9px;
    color: #8888aa;
    margin-bottom: 6px;
  }

  .equip-slots {
    display: flex;
    gap: 8px;
  }

  .equip-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 48px;
    padding: 4px;
    background: #0d0d1a;
    border: 1px solid #0f3460;
    border-radius: 6px;
  }

  .equip-slot.filled {
    border-color: #f5c518;
    background: rgba(245, 197, 24, 0.05);
  }

  .equip-item {
    font-size: 18px;
    cursor: default;
  }

  .empty-slot {
    font-size: 14px;
    opacity: 0.3;
  }

  .slot-label {
    font-size: 7px;
    color: #8888aa;
    font-family: 'Press Start 2P', cursive;
  }

  .inventory-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
  }

  .inv-slot {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0d0d1a;
    border: 1px solid #0f3460;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .inv-slot:hover:not(.empty) {
    border-color: #4af;
    background: rgba(68, 170, 255, 0.1);
  }

  .inv-slot.selected {
    border-color: #f5c518;
    background: rgba(245, 197, 24, 0.1);
    box-shadow: 0 0 8px rgba(245, 197, 24, 0.3);
  }

  .inv-slot.empty {
    cursor: default;
    opacity: 0.4;
  }

  .inv-sprite {
    font-size: 16px;
  }

  .item-actions {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #0f3460;
  }

  .item-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .item-sprite {
    font-size: 18px;
  }

  .item-name {
    font-size: 11px;
    color: #e0e0e0;
  }

  .action-buttons {
    display: flex;
    gap: 6px;
  }

  .action-btn {
    flex: 1;
    padding: 6px;
    border-radius: 4px;
    border: 1px solid;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .use-btn {
    background: rgba(15, 52, 96, 0.5);
    border-color: #0f3460;
    color: #4af;
  }

  .use-btn:hover {
    background: rgba(15, 52, 96, 0.8);
    border-color: #4af;
  }

  .drop-btn {
    background: rgba(233, 69, 96, 0.1);
    border-color: #e94560;
    color: #e94560;
  }

  .drop-btn:hover {
    background: rgba(233, 69, 96, 0.2);
  }
</style>
