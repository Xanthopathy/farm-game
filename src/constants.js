// src/constants.js
export const DEPTHS = {
  GRASS: 0,
  TILE: 1,
  CROP_BOTTOM: 2,
  CROP_TOP: 3,
  OBJECTS: 4,
  PLAYER: 10,
};

// Flat tiles
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
    variationChance: 0.2, // 20% chance for variation
  },
  DIRT: {
    texture: "terrain",
    frames: {
      default: 45,
      variations: [60, 61, 76, 77],
    },
    variationChance: 0.3, // 30% chance for variation
  },
  TILLED: { texture: "terrain", frames: { default: 92 } },
  PATH: {
    // STONE PATH IN OBJECTS.PNG WITH VARIATIONS FOR CONNECTING NEIGHBORS NOT DECORATION
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
// Currently used for grass and tilled tiles, and assumes non-connecting neighbors are plain dirt
const BASE_BITMASK_PATTERN = {
  64: 0, // Touching bottom only, rest touch dirt
  80: 1, // Bottom and right only
  88: 2, // Left, bottom, right
  72: 3, // Left, bottom
  91: 4, // Top left, bottom, right
  216: 5,
  120: 6,
  94: 7,
  208: 8,
  250: 9,
  248: 10,
  104: 11, // 12-15 aren't part of the 12x4 grid
  66: 16,
  82: 17,
  90: 18,
  74: 19,
  210: 20,
  254: 21,
  251: 22,
  106: 23,
  214: 24,
  126: 25,
  123: 27, // same with 28-31
  2: 32,
  18: 33,
  26: 34,
  10: 35,
  86: 36,
  223: 37,
  127: 38,
  75: 39,
  222: 40,
  255: 41, // pure tile, identical to TILE_TYPES.GRASS.frames.default or TILLED
  219: 42,
  107: 43, // same with 44-47
  0: 48, // Default single tile with no connecting neighbors (.py scripts ignored this) (by no connecting it means all neighbors are dirt so it's a single grass or tilled tile)
  16: 49,
  24: 50,
  8: 51,
  122: 52,
  30: 53,
  27: 54,
  218: 55,
  22: 56,
  31: 57,
  95: 58,
  11: 59,
};

// Grass and tilled soil share the same bitmask pattern at different sheet offsets.
const createTableWithOffset = (offset) => {
  return Object.fromEntries(
    Object.entries(BASE_BITMASK_PATTERN).map(([mask, frame]) => [
      mask,
      Number(frame) + offset,
    ]),
  );
};

export const GRASS_BITMASK_TABLE = createTableWithOffset(0);
export const TILLED_BITMASK_TABLE = createTableWithOffset(64);

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
      113, // Stage 0
      114, // Stage 1
      115, // Stage 2
      { bottom: 116, top: 100 }, // Stage 3
      { bottom: 117, top: 101 }, // Stage 4
      { bottom: 118, top: 102 }, // Stage 5
      { bottom: 119, top: 103 }, // Stage 6 (Harvestable)
    ],
    growthTime: 3000,
    sellValue: 3,
  },
  CORN: {
    name: "Corn",
    frames: [
      26, // Stage 0 (Seed)
      27, // Stage 1
      { bottom: 28, top: 12 }, // Stage 2
      { bottom: 29, top: 13 }, // Stage 3
      { bottom: 30, top: 14 }, // Stage 4
      { bottom: 31, top: 15 }, // Stage 5 (Harvestable)
    ],
    growthTime: 5000,
    sellValue: 10,
  },
  TURNIP: {
    name: "Turnip",
    frames: [
      58, // Stage 0 (Seed)
      59, // Stage 1
      60, // Stage 2
      61, // Stage 3
      { bottom: 62, top: 46 }, // Stage 4 (Harvestable)
    ],
    growthTime: 0,
    sellValue: 0,
  },
  PUMPKIN: {
    name: "Pumpkin",
    frames: [
      90, // Stage 0 (Seed)
      91, // Stage 1
      92, // Stage 2
      { bottom: 93, top: 77 }, // Stage 3
      { bottom: 94, top: 78 }, // Stage 4
      { bottom: 95, top: 79 }, // Stage 5 (Harvestable)
    ],
    growthTime: 0,
    sellValue: 0,
  },
  GARLIC: {
    name: "Garlic",
    frames: [
      122, // Stage 0 (Seed)
      123, // Stage 1
      124, // Stage 2
      125, // Stage 3
      { bottom: 126, top: 110 }, // Stage 4 (Harvestable)
    ],
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
    id: 1,
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

/* Harvested crop seed packet index: (all in objects)
wheat: 96
corn: 24
turnip: 56
pumpkin: 88
garlic: 120
*/

/* Harvested crop produce index: (all in objects) (I suppose we display in inventory HUD)
wheat: 112
corn: 25
turnip: 57
pumpkin: 89
garlic: 121
*/
