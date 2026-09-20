import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MapScene } from './scenes/MapScene.js';
import { UIScene } from './scenes/UIScene.js';

// A Phaser game is a set of "scenes". Each scene is like a separate screen or
// layer with its own objects and its own update loop.
//   BootScene -> loads data + pictures, then starts MapScene
//   MapScene  -> the world you walk around in (moves with the camera)
//   UIScene   -> text/buttons drawn on top, never moves or zooms
const game = new Phaser.Game({
  type: Phaser.AUTO,           // WebGL if available
  parent: 'game',
  backgroundColor: '#2d3a24',
  scale: {
    mode: Phaser.Scale.RESIZE, // canvas always fills the browser window
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [BootScene, MapScene, UIScene],
});

// Handy for poking around in the browser console: window.game.scene.getScene('MapScene')
window.game = game;
