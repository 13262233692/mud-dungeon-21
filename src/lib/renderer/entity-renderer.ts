import type { Entity, Item } from '@shared/types';
import { TILE_SIZE } from '@shared/types';

export class EntityRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  renderEntities(entities: Entity[], cameraX: number, cameraY: number, currentPlayerId: string | null): void {
    const ctx = this.ctx;

    for (const entity of entities) {
      if (entity.id === currentPlayerId) continue;

      const screenX = entity.x * TILE_SIZE - cameraX;
      const screenY = entity.y * TILE_SIZE - cameraY;

      if (screenX < -TILE_SIZE || screenY < -TILE_SIZE) continue;

      if (entity.type === 'player') {
        ctx.fillStyle = '#0f3460';
        ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.strokeStyle = '#4a8aff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      } else if (entity.type === 'monster') {
        ctx.fillStyle = 'rgba(233, 69, 96, 0.2)';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }

      ctx.font = `${TILE_SIZE - 8}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(entity.sprite, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);

      if (entity.hp < entity.maxHp) {
        const barWidth = TILE_SIZE - 4;
        const barHeight = 3;
        const barX = screenX + 2;
        const barY = screenY - 5;
        const hpRatio = entity.hp / entity.maxHp;

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = hpRatio > 0.5 ? '#4aff4a' : hpRatio > 0.25 ? '#f5c518' : '#e94560';
        ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
      }

      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(entity.name, screenX + TILE_SIZE / 2, screenY - 9);
    }
  }

  renderPlayer(player: Entity, cameraX: number, cameraY: number): void {
    const ctx = this.ctx;
    const screenX = player.x * TILE_SIZE - cameraX;
    const screenY = player.y * TILE_SIZE - cameraY;

    ctx.fillStyle = 'rgba(79, 172, 254, 0.15)';
    ctx.beginPath();
    ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f3460';
    ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.strokeStyle = '#4af';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    ctx.font = `${TILE_SIZE - 8}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.sprite, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
  }

  renderItems(items: Item[], cameraX: number, cameraY: number): void {
    const ctx = this.ctx;

    for (const item of items) {
      const screenX = item.x * TILE_SIZE - cameraX;
      const screenY = item.y * TILE_SIZE - cameraY;

      if (screenX < -TILE_SIZE || screenY < -TILE_SIZE) continue;

      const pulse = Math.sin(Date.now() / 500 + item.x * 3 + item.y * 7) * 0.15 + 0.85;

      ctx.globalAlpha = pulse;
      ctx.font = `${TILE_SIZE - 10}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.sprite, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
      ctx.globalAlpha = 1;
    }
  }
}
