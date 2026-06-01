import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '@shared/types';

export class FogRenderer {
  private ctx: CanvasRenderingContext2D;
  private viewportWidth = 0;
  private viewportHeight = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  render(explored: boolean[][] | undefined, cameraX: number, cameraY: number, playerX: number, playerY: number): void {
    if (!explored) return;

    const ctx = this.ctx;
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = this.viewportWidth;
    fogCanvas.height = this.viewportHeight;
    const fogCtx = fogCanvas.getContext('2d')!;

    fogCtx.fillStyle = 'rgba(10, 10, 20, 0.85)';
    fogCtx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    fogCtx.globalCompositeOperation = 'destination-out';

    for (let row = 0; row < MAP_HEIGHT; row++) {
      for (let col = 0; col < MAP_WIDTH; col++) {
        if (!explored[row]?.[col]) continue;
        const screenX = col * TILE_SIZE - cameraX;
        const screenY = row * TILE_SIZE - cameraY;
        if (screenX < -TILE_SIZE || screenY < -TILE_SIZE || screenX > this.viewportWidth || screenY > this.viewportHeight) continue;
        fogCtx.fillStyle = 'rgba(0, 0, 0, 1)';
        fogCtx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }

    const playerScreenX = playerX * TILE_SIZE - cameraX + TILE_SIZE / 2;
    const playerScreenY = playerY * TILE_SIZE - cameraY + TILE_SIZE / 2;
    const viewRadius = TILE_SIZE * 5;
    const gradient = fogCtx.createRadialGradient(
      playerScreenX, playerScreenY, viewRadius * 0.6,
      playerScreenX, playerScreenY, viewRadius
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    fogCtx.fillStyle = gradient;
    fogCtx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    ctx.drawImage(fogCanvas, 0, 0);
  }

  renderMiniMap(
    explored: boolean[][] | undefined,
    mapWidth: number,
    mapHeight: number,
    playerX: number,
    playerY: number,
    entities: { x: number; y: number; type: string; sprite: string }[],
    offsetX: number,
    offsetY: number,
    size: number
  ): void {
    if (!explored) return;

    const ctx = this.ctx;
    const tileW = size / mapWidth;
    const tileH = size / mapHeight;

    ctx.fillStyle = 'rgba(10, 10, 30, 0.8)';
    ctx.fillRect(offsetX, offsetY, size, size);
    ctx.strokeStyle = '#0f3460';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, size, size);

    for (let row = 0; row < mapHeight; row++) {
      for (let col = 0; col < mapWidth; col++) {
        if (!explored[row]?.[col]) continue;
        const mx = offsetX + col * tileW;
        const my = offsetY + row * tileH;
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(mx, my, Math.max(tileW, 1), Math.max(tileH, 1));
      }
    }

    for (const entity of entities) {
      if (entity.type === 'monster') {
        ctx.fillStyle = '#e94560';
      } else if (entity.type === 'player') {
        ctx.fillStyle = '#4af';
      } else {
        continue;
      }
      ctx.fillRect(
        offsetX + entity.x * tileW,
        offsetY + entity.y * tileH,
        Math.max(tileW * 2, 2),
        Math.max(tileH * 2, 2)
      );
    }

    ctx.fillStyle = '#4aff4a';
    ctx.fillRect(
      offsetX + playerX * tileW - 1,
      offsetY + playerY * tileH - 1,
      Math.max(tileW * 3, 3),
      Math.max(tileH * 3, 3)
    );
  }
}
