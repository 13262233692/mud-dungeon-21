<script lang="ts">
  import { gameStore } from '../lib/stores/game-store.js';
  import { onMount } from 'svelte';

  let logContainer: HTMLDivElement;
  let logs = $derived($gameStore.logs);

  $effect(() => {
    if (logContainer) {
      logs;
      requestAnimationFrame(() => {
        logContainer.scrollTop = logContainer.scrollHeight;
      });
    }
  });
</script>

<div class="event-log" bind:this={logContainer}>
  {#each logs as log}
    <div class="log-entry log-{log.level}">
      <span class="log-time">
        {new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span class="log-msg">{log.message}</span>
    </div>
  {/each}
</div>

<style>
  .event-log {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
    font-size: 11px;
    line-height: 1.6;
    min-height: 0;
  }

  .log-entry {
    padding: 2px 0;
    border-bottom: 1px solid rgba(15, 52, 96, 0.3);
    display: flex;
    gap: 8px;
  }

  .log-time {
    color: #4a4a6a;
    font-size: 9px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .log-msg {
    word-break: break-word;
  }

  .log-info { color: #4af; }
  .log-combat { color: #e94560; }
  .log-loot { color: #f5c518; }
  .log-warn { color: #f5a518; }
  .log-error { color: #ff4444; }
</style>
