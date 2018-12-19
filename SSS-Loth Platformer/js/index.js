import PlatformerScene from "./platformer-scene.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  //pixelArt: false,
  backgroundColor: "#1d212d",
  scene: PlatformerScene,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 900 }
    }
  }
};

const game = new Phaser.Game(config);
