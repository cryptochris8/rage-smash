import { Game } from './game/Game';

const container = document.getElementById('app');
if (container) {
  new Game(container);
}
