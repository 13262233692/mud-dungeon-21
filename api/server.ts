import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { GameEngine } from './engine/game-engine.js';
import { WsGateway } from './gateway/ws-gateway.js';

const PORT = 3000;

const app = express();
const server = createServer(app);

app.use(express.static('dist'));

const wss = new WebSocketServer({ server, path: '/ws' });

const engine = new GameEngine();
const gateway = new WsGateway(engine);

wss.on('connection', (ws) => {
  gateway.handleConnection(ws);
});

server.listen(PORT, () => {
  console.log(`MUD Dungeon Server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
