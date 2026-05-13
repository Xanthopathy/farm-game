// src/constants.js
export const DEPTHS = {
  GRASS: 0,
  TILE: 1,
  CROP_BOTTOM: 2,
  CROP_TOP: 3,
  OBJECTS: 4,
  PLAYER: 10,
};

export const TILE_TYPES = {
  // 8-Bit Values
  // NW:1, N:2, NE:4, W:8, E:16, SW:32, S:64, SE:128
  // TL:1, T:2, TR:4, L:8, R:16, BL:32, B:64, BR:128
  GRASS: {
    texture: "terrain",
    frames: {
      default: 13,
      variations: [12, 28, 29, 44],
    },
  },
  DIRT: {
    texture: "terrain",
    frames: {
      default: 45,
      variations: [60, 61, 76, 77],
    },
  },
  TILLED: { texture: "terrain", frames: { default: 92 } },
  PATH: {
    texture: "objects",
    frames: {
      default: 21,
      noTL: 22,
      noTR: 23,
      noBL: 38,
      noBR: 39,
    },
  },
};

// Starting from 0, 0 in top left corner of terrain.png
// Bitmask: TL:1, T:2, TR:4, L:8, R:16, BL:32, B:64, BR:128
// Sum of bitmask corresponds to which of the 8 neighbors are the same type, which determines the tile frame to use
// Key = sum of bitmask, value = frame index
const BASE_BITMASK_PATTERN = {
  64: 0,
  80: 1,
  88: 2,
  72: 3,
  91: 4,
  216: 5,
  120: 6,
  94: 7,
  208: 8,
  250: 9,
  248: 10,
  104: 11,
  66: 12,
  82: 13,
  90: 14,
  74: 15,
  210: 16,
  254: 17,
  251: 18,
  106: 19,
  214: 20,
  126: 21,
  123: 23,
  2: 24,
  18: 25,
  26: 26,
  10: 27,
  86: 28,
  223: 29,
  127: 30,
  75: 31,
  222: 32,
  255: 33,
  219: 34,
  107: 35,
  0: 45, // Default single tile with no connecting neighbors(.py scripts ignored this)
  16: 37,
  24: 38,
  8: 39,
  122: 40,
  30: 41,
  27: 42,
  218: 43,
  22: 44,
  31: 45,
  95: 46,
  11: 47,
};

// Helper function to create offset tables
const createTableWithOffset = (offset) => {
  return Object.fromEntries(
    Object.entries(BASE_BITMASK_PATTERN).map(([mask, frame]) => [
      mask,
      Number(frame) + offset,
    ]),
  );
};

export const GRASS_BITMASK_TABLE = createTableWithOffset(0);
export const TILLED_BITMASK_TABLE = createTableWithOffset(48);

// Starting from 0, 0 in top left corner of objects.png
// Bitmask: T: 1, R:2, B:4, L:8
// Sum of bitmask corresponds to which of the 8 neighbors are the same type, which determines the tile frame to use
// Key = sum of bitmask, value = frame index
export const FENCE_BITMASK_TABLE = {
  6: 0,
  11: 1,
  12: 2,
  4: 3,
  7: 16,
  15: 17,
  13: 18,
  5: 19,
  3: 32,
  11: 33,
  9: 34,
  1: 35,
  2: 48,
  10: 49,
  8: 50,
  0: 51,
};

export const CROP_TYPES = {
  WHEAT: {
    name: "Wheat",
    frames: [
      113, // Stage 0 - bottom only
      114, // Stage 1 - bottom only
      115, // Stage 2 - bottom only
      { bottom: 116, top: 100 }, // Stage 3 - bottom + top
      { bottom: 117, top: 101 }, // Stage 4 - bottom + top
      { bottom: 118, top: 102 }, // Stage 5 - bottom + top
      { bottom: 119, top: 103 }, // Stage 6 - bottom + top
    ],
    growthTime: 3000,
    sellValue: 3,
  },
  CORN: {
    name: "Corn",
    frames: [
      26, // Stage 0 (Seed) - bottom only
      27, // Stage 1 - bottom only
      { bottom: 28, top: 12 }, // Stage 2 - bottom only + top
      { bottom: 29, top: 13 }, // Stage 3 - bottom + top
      { bottom: 30, top: 14 }, // Stage 4 - bottom + top
      { bottom: 31, top: 15 }, // Stage 5 - bottom + top
    ],
    growthTime: 5000,
    sellValue: 10,
  },
};

export const WORLD_OBJECTS = {
  WELL: { texture: "tiny_town", frames: { bottom: 104, top: 92 } },
  BIN: { texture: "objects", frames: { default: 37 } },
};

export const TOOLS = {
  NONE: {
    id: 0,
    label: "None",
  },
  HOE: {
    d: 1,
    label: "Hoe",
    texture: "tiny_town",
    frames: { default: 116 },
  },
  BUCKET: {
    id: 2,
    label: "Bucket",
    texture: "tiny_town",
    frames: { default: 131, empty: 130 },
  },
  SEEDS: {
    id: 3,
    label: "Seeds",
    texture: "objects",
    frames: { default: 24 },
  },
  SCYTHE: {
    id: 4,
    label: "Scythe",
    texture: "tiny_town",
    frames: { default: 129 },
  },
};
