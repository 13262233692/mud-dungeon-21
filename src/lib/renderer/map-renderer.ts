import type { GameMap, Player } from '@shared/types';
import { TILE_SIZE, TILE_FLOOR, TILE_WALL, TILE_DOOR, TILE_STAIRS, TILE_WATER, TILE_LAVA } from '@shared/types';

const TILE_COLORS: Record<number, string> = {
  [TILE_FLOOR]: '#2a2a4a',
  [TILE_WALL]: '#4a4a6a',
  [TILE_DOOR]: '#8b6914',
  [TILE_STAIRS]: '#f5c518',
  [TILE_WATER]: '#1a4a8a',
  [TILE_LAVA]: '#e94560',
};

const WALL_TOP_COLOR = '#5a5a7a';
const GRID_COLOR = '#1a1a2e';

export class MapRenderer {
  private ctx: CanvasRenderingContext2D;
  private map: GameMap | null = null;
  private cameraX = 0;
  private cameraY = 0;
  private viewportWidth = 0;
  private viewportHeight = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  setMap(map: GameMap): void {
    this.map = map;
  }

  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  updateCamera(playerX: number, playerY: number): void {
    const targetX = playerX * TILE_SIZE - this.viewportWidth / 2 + TILE_SIZE / 2;
    const targetY = playerY * TILE_SIZE - this.viewportHeight / 2 + TILE_SIZE / 2;

    this.cameraX += (targetX - this.cameraX) * 0.15;
    this.cameraY += (targetY - this.cameraY) * 0.15;
  }

  render(explored: boolean[][] | undefined): void {
    if (!this.map) return;

    const ctx = this.ctx;
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    const startCol = Math.max(0, Math.floor(this.cameraX / TILE_SIZE));
    const endCol = Math.min(this.map.width, Math.ceil((this.cameraX + this.viewportWidth) / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(this.cameraY / TILE_SIZE));
    const endRow = Math.min(this.map.height, Math.ceil((this.cameraY + this.viewportHeight) / TILE_SIZE));

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const isExplored = explored?.[row]?.[col] ?? false;
        if (!isExplored) continue;

        const screenX = col * TILE_SIZE - this.cameraX;
        const screenY = row * TILE_SIZE - this.cameraY;
        const tile = this.map.tiles[row]?.[col] ?? TILE_WALL;

        const color = TILE_COLORS[tile] ?? TILE_COLORS[TILE_WALL]!;
        ctx.fillStyle = color;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        if (tile === TILE_WALL) {
          ctx.fillStyle = WALL_TOP_COLOR;
          ctx.fillRect(screenX, screenY, TILE_SIZE, 4);
          ctx.fillStyle = '#3a3a5a';
          ctx.fillRect(screenX + 2, screenY + 6, TILE_SIZE - 4, 2);
          ctx.fillRect(screenX + 6, screenY + 14, TILE_SIZE - 8, 2);
          ctx.fillRect(screenX + 2, screenY + 22, TILE_SIZE - 4, 2);
        }

        if (tile === TILE_FLOOR) {
          ctx.strokeStyle = GRID_COLOR;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

          if ((row + col) % 7 === 0) {
            ctx.fillStyle = '#252545';
            ctx.fillRect(screenX + 10, screenY + 12, 3, 3);
          }
        }

        if (tile === TILE_STAIRS) {
          ctx.font = '20px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🪜', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }

        if (tile === TILE_DOOR) {
          ctx.fillStyle = '#a07a20';
          ctx.fillRect(screenX + 4, screenY + 2, TILE_SIZE - 8, TILE_SIZE - 4);
          ctx.fillStyle = '#c49a30';
          ctx.fillRect(screenX + 8, screenY + 6, TILE_SIZE - 16, TILE_SIZE - 12);
          ctx.fillStyle = '#f5c518';
          ctx.beginPath();
          ctx.arc(screenX + TILE_SIZE - 10, screenY + TILE_SIZE / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  getCamera(): { x: number; y: number } {
    return { x: this.cameraX, y: this.cameraY };
  }
}
