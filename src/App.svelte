<script lang="ts">
  import { gameStore } from './lib/stores/game-store.js';
  import LoginPage from './pages/LoginPage.svelte';
  import GamePage from './pages/GamePage.svelte';

  let currentPage = $state<'login' | 'game'>('login');

  gameStore.subscribe(($s) => {
    if ($s.authenticated && currentPage === 'login') {
      currentPage = 'game';
    }
    if (!$s.connected && currentPage === 'game') {
      currentPage = 'login';
    }
  });
</script>

{#if currentPage === 'login'}
  <LoginPage />
{:else}
  <GamePage />
{/if}
