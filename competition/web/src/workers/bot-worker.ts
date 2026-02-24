// Web Worker: loads a chess bot WASM module and executes moves on demand.
// Runs in a separate thread to avoid blocking the UI during computation.

import type { WorkerInMessage, WorkerOutMessage } from '../lib/types';

interface ChessBotModule {
  move(fen: string, timeLimitMs: number): string;
}

let bot: ChessBotModule | null = null;

self.onmessage = async (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;

  if (msg.type === 'load') {
    try {
      // Dynamically import the Emscripten ES6 module
      // The URL points to e.g. /bots/alice.js which co-locates with alice.wasm
      const module = await import(/* @vite-ignore */ msg.botUrl);

      // Emscripten ES6 modules export a default factory function
      const factory = module.default;
      bot = await factory();

      const reply: WorkerOutMessage = { type: 'ready' };
      self.postMessage(reply);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const reply: WorkerOutMessage = { type: 'error', message: `Failed to load bot: ${message}` };
      self.postMessage(reply);
    }
  } else if (msg.type === 'move') {
    if (!bot) {
      const reply: WorkerOutMessage = { type: 'error', message: 'Bot not loaded' };
      self.postMessage(reply);
      return;
    }

    try {
      const uci = bot.move(msg.fen, msg.timeLimitMs);
      const reply: WorkerOutMessage = { type: 'result', uci };
      self.postMessage(reply);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const reply: WorkerOutMessage = { type: 'error', message: `Bot move error: ${message}` };
      self.postMessage(reply);
    }
  }
};
