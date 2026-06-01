<script lang="ts">
  import { onMount } from 'svelte';
  import { gameStore, playerPosition } from '../lib/stores/game-store.js';
  import { MapRenderer } from '../lib/renderer/map-renderer.js';
  import { EntityRenderer } from '../lib/renderer/entity-renderer.js';
  import { FogRenderer } from '../lib/renderer/fog-renderer.js';
  import { MudClient } from '../lib/protocol/mud-client.js';
  import type { Direction } from '@shared/types';

  let canvas: HTMLCanvasElement;
  let mapRenderer: MapRenderer;
  let entityRenderer: EntityRenderer;
  let fogRenderer: FogRenderer;
  let animFrame: number;
  let client: MudClient;

  let { client: clientProp, oncommand }: { client: MudClient; oncommand: (action: string, params?: Record<string, unknown>) => void } = $props();

  client = clientProp;

  const TILE_SIZE = 32;

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    mapRenderer = new MapRenderer(ctx);
    entityRenderer = new EntityRenderer(ctx);
    fogRenderer = new FogRenderer(ctx);

    function resize() {
      const container = canvas.parentElement!;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      mapRenderer.resize(canvas.width, canvas.height);
      fogRenderer.resize(canvas.width, canvas.height);
    }

    resize();
    window.addEventListener('resize', resize);

    function gameLoop() {
      const $s = getStore();
      if (!$s.player || !$s.map) {
        animFrame = requestAnimationFrame(gameLoop);
        return;
      }

      mapRenderer.setMap($s.map);
      mapRenderer.updateCamera($s.player.x, $s.player.y);
      const cam = mapRenderer.getCamera();

      const ctx2 = canvas.getContext('2d')!;
      ctx2.clearRect(0, 0, canvas.width, canvas.height);

      mapRenderer.render($s.player.explored);
      entityRenderer.renderItems($s.items, cam.x, cam.y);
      entityRenderer.renderEntities($s.entities, cam.x, cam.y, $s.playerId);
      entityRenderer.renderPlayer($s.player, cam.x, cam.y);
      fogRenderer.render($s.player.explored, cam.x, cam.y, $s.player.x, $s.player.y);

      const miniSize = 140;
      fogRenderer.renderMiniMap(
        $s.player.explored,
        $s.map.width,
        $s.map.height,
        $s.player.x,
        $s.player.y,
        $s.entities,
        canvas.width - miniSize - 10,
        10,
        miniSize
      );

      animFrame = requestAnimationFrame(gameLoop);
    }

    animFrame = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrame);
    };
  });

  function getStore() {
    let val: any;
    gameStore.subscribe((v) => val = v)();
    return val;
  }

  function handleKeydown(e: KeyboardEvent) {
    const $s = getStore();
    if (!$s.player || $s.inCombat) return;

    const dirMap: Record<string, Direction> = {
      ArrowUp: 'north', w: 'north', W: 'north',
      ArrowDown: 'south', s: 'south', S: 'south',
      ArrowLeft: 'west', a: 'west', A: 'west',
      ArrowRight: 'east', d: 'east', D: 'east',
    };

    const dir = dirMap[e.key];
    if (dir) {
      e.preventDefault();
      client.move(dir);
    }

    if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      client.pick('nearest');
    }
  }

  function handleCanvasClick(e: MouseEvent) {
    const $s = getStore();
    if (!$s.player || !$s.map) return;

    const rect = canvas.getBoundingClientRect();
    const cam = mapRenderer.getCamera();
    const worldX = Math.floor((e.clientX - rect.left + cam.x) / TILE_SIZE);
    const worldY = Math.floor((e.clientY - rect.top + cam.y) / TILE_SIZE);

    const dx = worldX - $s.player.x;
    const dy = worldY - $s.player.y;

    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0)) {
      let dir: Direction;
      if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx > 0 ? 'east' : 'west';
      } else {
        dir = dy > 0 ? 'south' : 'north';
      }
      client.move(dir);
    }

    for (const entity of $s.entities) {
      if (entity.x === worldX && entity.y === worldY && entity.type === 'monster') {
        client.attack(entity.id);
        break;
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<canvas
  bind:this={canvas}
  class="game-canvas"
  onclick={handleCanvasClick}
></canvas>

<style>
  .game-canvas {
    width: 100%;
    height: 100%;
    display: block;
    cursor: crosshair;
    image-rendering: pixelated;
  }
</style>
