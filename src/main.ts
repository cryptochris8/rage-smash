import { Game } from './game/Game';

const container = document.getElementById('app');
if (container) {
  const game = new Game(container);

  // Dev-only listener-count probe. Vite strips this from production bundles
  // because the `if (import.meta.env.DEV)` block is dead code under PROD.
  // Helps catch subscription leaks before they ship.
  if (import.meta.env.DEV) {
    let lastCount = 0;
    setInterval(() => {
      const n = (game as any).store?.getListenerCount?.() ?? 0;
      if (n !== lastCount) {
        console.log(`[store] listener count: ${n}`);
        lastCount = n;
      }
    }, 30_000);
  }
}
