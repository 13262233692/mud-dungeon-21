import type { MudMessage, Direction, PlayerMode } from '@shared/types';

type MessageHandler = (type: string, payload: Record<string, unknown>) => void;

export class MudClient {
  private ws: WebSocket | null = null;
  private handler: MessageHandler | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string;

  constructor(url?: string) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = url || `${proto}//${window.location.host}/ws`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data as string) as MudMessage;
            if (this.handler) {
              this.handler(msg.type, msg.payload);
            }
          } catch {
            // ignore malformed messages
          }
        };

        this.ws.onclose = () => {
          if (this.handler) {
            this.handler('disconnected', { message: '与服务器断开连接' });
          }
        };

        this.ws.onerror = () => {
          reject(new Error('WebSocket连接失败'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  onMessage(handler: MessageHandler): void {
    this.handler = handler;
  }

  send(type: string, payload: Record<string, unknown> = {}): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  auth(name: string, mode: PlayerMode): void {
    this.send('auth', { name, mode });
  }

  move(direction: Direction): void {
    this.send('move', { direction });
  }

  attack(targetId: string): void {
    this.send('attack', { targetId });
  }

  pick(itemId: string = 'nearest'): void {
    this.send('pick', { itemId });
  }

  use(itemId: string): void {
    this.send('use', { itemId });
  }

  drop(itemId: string): void {
    this.send('drop', { itemId });
  }

  chat(message: string): void {
    this.send('chat', { message });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
