<script lang="ts">
  import { gameStore } from '../lib/stores/game-store.js';

  let player = $derived($gameStore.player);
  let hpPercent = $derived(player ? (player.hp / player.maxHp) * 100 : 0);
  let expPercent = $derived(player ? (player.exp / (player.level * 50)) * 100 : 0);
</script>

<div class="status-bar">
  <div class="player-header">
    <span class="player-name">{player?.sprite || '🧑'} {player?.name || '未知'}</span>
    <span class="player-level">Lv.{player?.level || 1}</span>
  </div>

  <div class="stat-row">
    <span class="stat-label">HP</span>
    <div class="stat-bar hp-bar-bg">
      <div class="stat-bar-fill hp-fill" style="width: {hpPercent}%"></div>
    </div>
    <span class="stat-value">{player?.hp || 0}/{player?.maxHp || 100}</span>
  </div>

  <div class="stat-row">
    <span class="stat-label">EXP</span>
    <div class="stat-bar exp-bar-bg">
      <div class="stat-bar-fill exp-fill" style="width: {expPercent}%"></div>
    </div>
    <span class="stat-value">{player?.exp || 0}/{(player?.level || 1) * 50}</span>
  </div>

  <div class="stats-grid">
    <div class="stat-item">
      <span class="stat-icon">⚔️</span>
      <span class="stat-num">{player?.attack || 0}</span>
    </div>
    <div class="stat-item">
      <span class="stat-icon">🛡️</span>
      <span class="stat-num">{player?.defense || 0}</span>
    </div>
    <div class="stat-item">
      <span class="stat-icon">💰</span>
      <span class="stat-num">{player?.gold || 0}</span>
    </div>
  </div>
</div>

<style>
  .status-bar {
    padding: 12px 16px;
    border-bottom: 1px solid #0f3460;
  }

  .player-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .player-name {
    font-family: 'Press Start 2P', cursive;
    font-size: 10px;
    color: #f5c518;
  }

  .player-level {
    font-family: 'Press Start 2P', cursive;
    font-size: 9px;
    color: #533483;
    background: rgba(83, 52, 131, 0.2);
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid #533483;
  }

  .stat-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .stat-label {
    font-family: 'Press Start 2P', cursive;
    font-size: 7px;
    color: #8888aa;
    width: 28px;
  }

  .stat-bar {
    flex: 1;
    height: 8px;
    background: #0d0d1a;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #0f3460;
  }

  .hp-bar-bg { border-color: #e94560; }
  .exp-bar-bg { border-color: #533483; }

  .stat-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .hp-fill {
    background: linear-gradient(90deg, #e94560, #ff6b6b);
    box-shadow: 0 0 6px rgba(233, 69, 96, 0.4);
  }

  .exp-fill {
    background: linear-gradient(90deg, #533483, #8b5cf6);
    box-shadow: 0 0 6px rgba(83, 52, 131, 0.4);
  }

  .stat-value {
    font-size: 9px;
    color: #8888aa;
    min-width: 60px;
    text-align: right;
  }

  .stats-grid {
    display: flex;
    gap: 12px;
    margin-top: 10px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .stat-icon {
    font-size: 14px;
  }

  .stat-num {
    font-family: 'Press Start 2P', cursive;
    font-size: 9px;
    color: #e0e0e0;
  }
</style>
