import { boot } from './boot-common.js?v=N2';
boot({
  params: { antialias: true, powerPreference: 'high-performance' },
  gameSrc: 'assets/game-world.js'
});
