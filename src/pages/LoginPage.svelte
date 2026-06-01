<script lang="ts">
  import { MudClient } from '../lib/protocol/mud-client.js';
  import { gameStore } from '../lib/stores/game-store.js';

  let name = $state('');
  let mode = $state<'player' | 'observer'>('player');
  let connecting = $state(false);
  let error = $state('');
  let client: MudClient | null = null;

  const particles: { x: number; y: number; vy: number; vx: number; life: number; size: number }[] = [];
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      vy: -(0.2 + Math.random() * 0.8),
      vx: (Math.random() - 0.5) * 0.5,
      life: Math.random(),
      size: 1 + Math.random() * 3,
    });
  }

  async function handleLogin() {
    if (!name.trim()) {
      error = '请输入你的冒险者名号';
      return;
    }
    connecting = true;
    error = '';

    try {
      client = new MudClient();

      client.onMessage((type, payload) => {
        switch (type) {
          case 'auth_ok':
            gameStore.setAuthenticated(payload['playerId'] as string);
            break;
          case 'auth_fail':
            error = payload['reason'] as string || '认证失败';
            connecting = false;
            break;
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
          case 'log':
            gameStore.addLog(payload['message'] as string, payload['level'] as string || 'info');
            break;
          case 'disconnected':
            gameStore.setConnected(false);
            break;
        }
      });

      await client.connect();
      gameStore.setConnected(true);
      client.auth(name.trim(), mode);
    } catch (err) {
      error = '无法连接到地牢服务器';
      connecting = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleLogin();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="login-container">
  <div class="particles">
    {#each particles as p}
      <div
        class="particle"
        style="
          left: {p.x}%;
          bottom: {-p.y * 10}%;
          width: {p.size}px;
          height: {p.size * 3}px;
          animation-delay: {p.life}s;
        "
      ></div>
    {/each}
  </div>

  <div class="login-card">
    <div class="title-glow">
      <h1 class="title">⚔️ MUD DUNGEON</h1>
      <p class="subtitle">深 入 地 牢 · 探 索 未 知</p>
    </div>

    <div class="input-group">
      <label class="label">冒险者名号</label>
      <input
        type="text"
        class="name-input"
        bind:value={name}
        placeholder="输入你的名字..."
        maxlength={16}
        disabled={connecting}
      />
    </div>

    <div class="mode-select">
      <button
        class="mode-btn"
        class:active={mode === 'player'}
        onclick={() => mode = 'player'}
        disabled={connecting}
      >
        ⚔️ 冒险者
      </button>
      <button
        class="mode-btn"
        class:active={mode === 'observer'}
        onclick={() => mode = 'observer'}
        disabled={connecting}
      >
        👁️ 观察者
      </button>
    </div>

    {#if error}
      <p class="error-msg">⚠️ {error}</p>
    {/if}

    <button
      class="enter-btn"
      onclick={handleLogin}
      disabled={connecting || !name.trim()}
    >
      {#if connecting}
        连接地牢中...
      {:else}
        🚪 进 入 地 牢
      {/if}
    </button>

    <p class="hint">WASD/方向键移动 · 自动遇敌 · 拾取战利品</p>
  </div>
</div>

<style>
  .login-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, #0d0d1a 0%, #1a1a2e 40%, #16213e 100%);
    position: relative;
    overflow: hidden;
  }

  .particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    background: linear-gradient(to top, transparent, #e94560, #f5c518);
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    opacity: 0.6;
    animation: float-up 3s ease-in infinite;
  }

  @keyframes float-up {
    0% { transform: translateY(0) scale(1); opacity: 0.6; }
    100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
  }

  .login-card {
    background: rgba(22, 33, 62, 0.9);
    border: 2px solid #0f3460;
    border-radius: 12px;
    padding: 48px 40px;
    width: 420px;
    max-width: 90vw;
    position: relative;
    z-index: 10;
    box-shadow: 0 0 30px rgba(15, 52, 96, 0.5), 0 0 60px rgba(233, 69, 96, 0.1);
    animation: card-appear 0.6s ease-out;
  }

  @keyframes card-appear {
    from { transform: scale(0.9) translateY(20px); opacity: 0; }
    to { transform: scale(1) translateY(0); opacity: 1; }
  }

  .title-glow {
    text-align: center;
    margin-bottom: 36px;
  }

  .title {
    font-family: 'Press Start 2P', cursive;
    font-size: 24px;
    color: #f5c518;
    text-shadow: 0 0 10px rgba(245, 197, 24, 0.5), 0 0 20px rgba(245, 197, 24, 0.3);
    animation: pulseGlow 2s ease-in-out infinite;
    letter-spacing: 2px;
  }

  .subtitle {
    font-family: 'Press Start 2P', cursive;
    font-size: 10px;
    color: #4af;
    margin-top: 12px;
    letter-spacing: 4px;
  }

  .input-group {
    margin-bottom: 20px;
  }

  .label {
    display: block;
    font-size: 11px;
    color: #8888aa;
    margin-bottom: 8px;
    letter-spacing: 1px;
  }

  .name-input {
    width: 100%;
    padding: 12px 16px;
    background: #0d0d1a;
    border: 2px solid #0f3460;
    border-radius: 8px;
    color: #e0e0e0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    outline: none;
    transition: border-color 0.3s, box-shadow 0.3s;
  }

  .name-input:focus {
    border-color: #4af;
    box-shadow: 0 0 10px rgba(68, 170, 255, 0.3);
  }

  .name-input::placeholder {
    color: #4a4a6a;
  }

  .mode-select {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
  }

  .mode-btn {
    flex: 1;
    padding: 10px;
    background: #0d0d1a;
    border: 2px solid #0f3460;
    border-radius: 8px;
    color: #8888aa;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .mode-btn.active {
    border-color: #e94560;
    color: #e94560;
    background: rgba(233, 69, 96, 0.1);
    box-shadow: 0 0 10px rgba(233, 69, 96, 0.2);
  }

  .mode-btn:hover:not(:disabled) {
    border-color: #4af;
    color: #4af;
  }

  .enter-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #0f3460, #533483);
    border: 2px solid #e94560;
    border-radius: 8px;
    color: #f5c518;
    font-family: 'Press Start 2P', cursive;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s;
    animation: glow 2s ease-in-out infinite;
  }

  .enter-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #1a4a8a, #6a4a9a);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(233, 69, 96, 0.4);
  }

  .enter-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-msg {
    color: #e94560;
    font-size: 12px;
    text-align: center;
    margin-bottom: 12px;
  }

  .hint {
    text-align: center;
    font-size: 9px;
    color: #4a4a6a;
    margin-top: 20px;
    letter-spacing: 1px;
  }
</style>
