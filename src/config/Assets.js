export const SPRITESHEETS = [
  {
    key: "terrain",
    path: "assets/terrain.png",
    frameWidth: 16,
    frameHeight: 16,
  },
  {
    key: "objects",
    path: "assets/objects.png",
    frameWidth: 16,
    frameHeight: 16,
  },
  {
    key: "tiny_town",
    path: "assets/tiny_town.png",
    frameWidth: 16,
    frameHeight: 16,
  },
  {
    key: "player_idle",
    path: "assets/player/idle.png",
    frameWidth: 32,
    frameHeight: 32,
  },
  {
    key: "player_walk",
    path: "assets/player/walk.png",
    frameWidth: 32,
    frameHeight: 32,
  },
];

export const loadSpritesheets = (scene) => {
  SPRITESHEETS.forEach(({ key, path, frameWidth, frameHeight }) => {
    scene.load.spritesheet(key, path, { frameWidth, frameHeight });
  });
};
