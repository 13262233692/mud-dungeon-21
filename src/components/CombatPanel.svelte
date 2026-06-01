<script lang="ts">
  import { gameStore } from '../lib/stores/game-store.js';
  import { MudClient } from '../lib/protocol/mud-client.js';

  let { client }: { client: MudClient } = $props();

  let inCombat = $derived($gameStore.inCombat);
  let enemy = $derived($gameStore.combatEnemy);
  let player = $derived($gameStore.player);

  function handleAttack() {
    if (enemy) {
      client.attack(enemy.id);
    }
  }

  function handlePickAndAttack() {
    if (enemy) {
      client.attack(enemy.id);
    }
  }

  function handleFlee() {
    const dirs = ['north', 'south', 'east', 'west'] as const;
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    client.move(dir);
  }
</script>

{#if inCombat && enemy}
  <div class="combat-overlay combat-panel-enter">
    <div class="combat-card">
      <div class="combat-header">
        <span class="combat-title">⚔️ 遭遇战</span>
      </div>

      <div class="combat-arena">
        <div class="combatant player-side">
          <div class="combatant-sprite">{player?.sprite || '🧑'}</div>
          <div class="combatant-name">{player?.name || '你'}</div>
          <div class="combat-hp-bar">
            <div class="hp-fill" style="width: {player ? (player.hp / player.maxHp) * 100 : 100}%"></div>
          </div>
          <div class="combat-hp-text">{player?.hp || 0}/{player?.maxHp || 100}</div>
        </div>

        <div class="vs-text">VS</div>

        <div class="combatant enemy-side">
          <div class="combatant-sprite enemy-sprite">{enemy.sprite}</div>
          <div class="combatant-name enemy-name">{enemy.name}</div>
          <div class="combat-hp-bar enemy-bar">
            <div class="hp-fill enemy-hp" style="width: {(enemy.hp / enemy.maxHp) * 100}%"></div>
          </div>
          <div class="combat-hp-text">{enemy.hp}/{enemy.maxHp}</div>
        </div>
      </div>

      <div class="combat-actions">
        <button class="combat-btn attack-btn" onclick={handleAttack}>
          ⚔️ 攻击
        </button>
        <button class="combat-btn flee-btn" onclick={handleFlee}>
          🏃 逃跑
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .combat-overlay {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-60%);
    z-index: 100;
  }

  .combat-card {
    background: rgba(22, 33, 62, 0.95);
    border: 2px solid #e94560;
    border-radius: 12px;
    padding: 20px 28px;
    min-width: 380px;
    box-shadow: 0 0 30px rgba(233, 69, 96, 0.3), 0 0 60px rgba(233, 69, 96, 0.1);
  }

  .combat-header {
    text-align: center;
    margin-bottom: 16px;
  }

  .combat-title {
    font-family: 'Press Start 2P', cursive;
    font-size: 12px;
    color: #e94560;
    text-shadow: 0 0 10px rgba(233, 69, 96, 0.5);
  }

  .combat-arena {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    margin-bottom: 16px;
  }

  .combatant {
    text-align: center;
    min-width: 100px;
  }

  .combatant-sprite {
    font-size: 40px;
    margin-bottom: 6px;
  }

  .enemy-sprite {
    animation: enemy-bounce 0.6s ease-in-out infinite;
  }

  @keyframes enemy-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  .combatant-name {
    font-size: 11px;
    color: #4af;
    margin-bottom: 6px;
  }

  .enemy-name {
    color: #e94560;
  }

  .combat-hp-bar {
    width: 100px;
    height: 8px;
    background: #0d0d1a;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #0f3460;
    margin: 0 auto 4px;
  }

  .enemy-bar {
    border-color: #e94560;
  }

  .hp-fill {
    height: 100%;
    background: linear-gradient(90deg, #4aff4a, #2a2);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .enemy-hp {
    background: linear-gradient(90deg, #e94560, #ff6b6b);
  }

  .combat-hp-text {
    font-size: 9px;
    color: #8888aa;
  }

  .vs-text {
    font-family: 'Press Start 2P', cursive;
    font-size: 16px;
    color: #f5c518;
    text-shadow: 0 0 10px rgba(245, 197, 24, 0.5);
  }

  .combat-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .combat-btn {
    padding: 10px 20px;
    border-radius: 8px;
    border: 2px solid;
    font-family: 'Press Start 2P', cursive;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .attack-btn {
    background: rgba(233, 69, 96, 0.15);
    border-color: #e94560;
    color: #e94560;
  }

  .attack-btn:hover {
    background: rgba(233, 69, 96, 0.3);
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(233, 69, 96, 0.4);
  }

  .flee-btn {
    background: rgba(15, 52, 96, 0.3);
    border-color: #0f3460;
    color: #4af;
  }

  .flee-btn:hover {
    background: rgba(15, 52, 96, 0.5);
    border-color: #4af;
  }
</style>
