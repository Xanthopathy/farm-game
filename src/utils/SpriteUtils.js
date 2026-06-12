// src/utils/SpriteUtils.js
/**
 * Creates fixed two-part objects where the top sprite is one tile above bottom.
 */
export const createStack = (scene, x, y, config, bottomDepth, topDepth) => {
  const bottom = scene.add
    .sprite(x, y, config.texture, config.frames.bottom)
    .setScale(2)
    .setDepth(bottomDepth);

  const top = scene.add
    .sprite(x, y - 32, config.texture, config.frames.top)
    .setScale(2)
    .setDepth(topDepth);

  return { bottom, top };
};

/**
 * Supports crops whose later growth stages need a second sprite above the
 * tile while earlier stages are only a bottom sprite.
 */
export const createDynamicStack = (
  scene,
  x,
  y,
  texture,
  bottomDepth,
  topDepth,
) => {
  const bottom = scene.add
    .sprite(x, y, texture)
    .setScale(2)
    .setDepth(bottomDepth);

  let top = null;

  const stack = {
    bottom,
    get top() {
      return top;
    },
    updateFrames(bottomFrame, topFrame = null) {
      bottom.setFrame(bottomFrame);

      if (topFrame) {
        if (!top) {
          top = scene.add
            .sprite(x, y - 32, texture, topFrame)
            .setScale(2)
            .setDepth(topDepth);
        } else {
          top.setFrame(topFrame);
        }
      } else if (top) {
        top.destroy();
        top = null;
      }
    },
  };

  return stack;
};
