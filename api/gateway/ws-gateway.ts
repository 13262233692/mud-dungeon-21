import type { WebSocket } from 'ws';
import { MudParser } from '../protocol/mud-parser.js';
import { GameEngine } from '../engine/game-engine.js';

interface ClientConnection {
  ws: WebSocket;
  playerId: string | null;
  name: string | null;
  mode: 'player' | 'observer';
}

export class WsGateway {
  private parser: MudParser;
  private engine: GameEngine;
  private clients: Map<WebSocket, ClientConnection> = new Map();

  constructor(engine: GameEngine) {
    this.parser = new MudParser();
    this.engine = engine;
  }

  handleConnection(ws: WebSocket): void {
    const client: ClientConnection = {
      ws,
      playerId: null,
      name: null,
      mode: 'player',
    };
    this.clients.set(ws, client);

    this.send(ws, 'log', {
      message: '欢迎来到MUD地牢！请输入昵称开始冒险。',
      level: 'info',
    });
    this.send(ws, 'log', {
      message: '发送 {"type":"auth","payload":{"name":"你的昵称","mode":"player"}} 进行认证',
      level: 'info',
    });

    ws.on('message', (data: Buffer) => {
      try {
        const raw = data.toString();
        const parsed = this.parser.parse(raw);
        if (!parsed) {
          this.send(ws, 'error', { message: '无法解析命令' });
          return;
        }
        this.handleCommand(ws, parsed.action, parsed.params);
      } catch (err) {
        this.send(ws, 'error', { message: '处理命令时出错' });
      }
    });

    ws.on('close', () => {
      const c = this.clients.get(ws);
      if (c?.playerId) {
        this.engine.state.removePlayer(c.playerId);
        this.broadcast('player_left', { playerId: c.playerId, name: c.name });
        this.broadcastPlayerList();
      }
      this.clients.delete(ws);
    });
  }

  private handleCommand(ws: WebSocket, action: string, params: Record<string, unknown>): void {
    const client = this.clients.get(ws);
    if (!client) return;

    if (action === 'auth') {
      this.handleAuth(ws, params);
      return;
    }

    if (!client.playerId) {
      this.send(ws, 'error', { message: '请先认证！发送auth命令' });
      return;
    }

    if (client.mode === 'observer') {
      this.send(ws, 'error', { message: '观察者无法执行操作' });
      return;
    }

    const results = this.engine.execute({
      playerId: client.playerId,
      action,
      params,
    });

    for (const result of results) {
      if (result.broadcast) {
        this.broadcastExcept(result.broadcast.type, result.broadcast.payload, ws);
      }
      this.send(ws, result.type, result.payload);
    }
  }

  private handleAuth(ws: WebSocket, params: Record<string, unknown>): void {
    const client = this.clients.get(ws);
    if (!client) return;
    if (client.playerId) {
      this.send(ws, 'error', { message: '已经认证过了' });
      return;
    }

    const name = params['name'] as string | undefined;
    if (!name || name.trim().length === 0) {
      this.send(ws, 'auth_fail', { reason: '昵称不能为空' });
      return;
    }

    const mode = (params['mode'] as 'player' | 'observer') || 'player';

    for (const c of this.clients.values()) {
      if (c.name === name.trim() && c.playerId) {
        this.send(ws, 'auth_fail', { reason: '该昵称已被使用' });
        return;
      }
    }

    const player = this.engine.state.addPlayer(name.trim(), mode);
    client.playerId = player.id;
    client.name = player.name;
    client.mode = mode;

    this.send(ws, 'auth_ok', {
      playerId: player.id,
      x: player.x,
      y: player.y,
    });

    this.send(ws, 'map_data', {
      width: this.engine.state.map.width,
      height: this.engine.state.map.height,
      tiles: this.engine.state.map.tiles,
      rooms: this.engine.state.map.rooms,
    });

    this.send(ws, 'player_status', {
      player: {
        id: player.id,
        type: player.type,
        x: player.x,
        y: player.y,
        hp: player.hp,
        maxHp: player.maxHp,
        attack: player.attack,
        defense: player.defense,
        name: player.name,
        sprite: player.sprite,
        level: player.level,
        exp: player.exp,
        inventory: player.inventory,
        gold: player.gold,
        equipped: player.equipped,
        explored: player.explored,
      },
    });

    const visibleEntities = this.engine.state.getVisibleEntities(player.id);
    const visibleItems = this.engine.state.getVisibleItems(player.id);
    this.send(ws, 'state_sync', {
      entities: visibleEntities,
      items: visibleItems,
    });

    this.send(ws, 'log', { message: `${name} 进入了地牢！`, level: 'info' });
    this.broadcastExcept('log', { message: `${name} 进入了地牢！`, level: 'info' }, ws);
    this.broadcastPlayerList();
  }

  send(ws: WebSocket, type: string, payload: Record<string, unknown>): void {
    if (ws.readyState === 1) {
      ws.send(this.parser.serialize(type, payload));
    }
  }

  broadcast(type: string, payload: Record<string, unknown>): void {
    const msg = this.parser.serialize(type, payload);
    for (const [ws] of this.clients) {
      if (ws.readyState === 1) {
        ws.send(msg);
      }
    }
  }

  broadcastExcept(type: string, payload: Record<string, unknown>, excludeWs: WebSocket): void {
    const msg = this.parser.serialize(type, payload);
    for (const [ws] of this.clients) {
      if (ws !== excludeWs && ws.readyState === 1) {
        ws.send(msg);
      }
    }
  }

  private broadcastPlayerList(): void {
    const players: { id: string; name: string; level: number }[] = [];
    for (const c of this.clients.values()) {
      if (c.playerId) {
        const p = this.engine.state.players.get(c.playerId);
        if (p) {
          players.push({ id: p.id, name: p.name, level: p.level });
        }
      }
    }
    this.broadcast('player_list', { players });
  }
}
