// src/utils/SpriteUtils.js
export const createStack = (scene, x, y, config, bottomDepth, topDepth) => {
  const bottom = scene.add
    .sprite(x, y, config.texture, config.frame.bottom)
    .setScale(2)
    .setDepth(bottomDepth);

  const top = scene.add
    .sprite(x, y - 32, config.texture, config.frame.top)
    .setScale(2)
    .setDepth(topDepth);

  return { bottom, top };
};
