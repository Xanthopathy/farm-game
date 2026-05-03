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

/**
 * Create a dynamic stacked sprite pair that can change frames
 * Perfect for crops that grow and need top/bottom sprites
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
