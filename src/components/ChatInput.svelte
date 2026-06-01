<script lang="ts">
  let { onsend }: { onsend: (message: string) => void } = $props();

  let message = $state('');

  function handleSubmit() {
    if (message.trim()) {
      onsend(message.trim());
      message = '';
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }
</script>

<div class="chat-input-container">
  <input
    type="text"
    class="chat-input"
    bind:value={message}
    onkeydown={handleKeydown}
    placeholder="输入消息或命令 (如: north, attack, pick)..."
  />
  <button class="send-btn" onclick={handleSubmit} disabled={!message.trim()}>
    发送
  </button>
</div>

<style>
  .chat-input-container {
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    border-top: 1px solid #0f3460;
  }

  .chat-input {
    flex: 1;
    padding: 8px 12px;
    background: #0d0d1a;
    border: 1px solid #0f3460;
    border-radius: 6px;
    color: #e0e0e0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    outline: none;
    transition: border-color 0.3s;
  }

  .chat-input:focus {
    border-color: #4af;
  }

  .chat-input::placeholder {
    color: #4a4a6a;
    font-size: 10px;
  }

  .send-btn {
    padding: 8px 14px;
    background: #0f3460;
    border: 1px solid #4af;
    border-radius: 6px;
    color: #4af;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .send-btn:hover:not(:disabled) {
    background: rgba(68, 170, 255, 0.2);
  }

  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
