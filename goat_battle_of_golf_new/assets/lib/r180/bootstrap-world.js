import { boot } from './boot-common.js?v=N1';
boot({
  params: { antialias: true, powerPreference: 'high-performance' },
  gameSrc: 'assets/game-world.js'
});
