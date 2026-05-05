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
  GRASS: { texture: "terrain", frame: 13 },
  DIRT: { texture: "terrain", frame: 45 },
  TILLED: { texture: "terrain", frame: 92 },
  PATH: { texture: "objects", frame: 21 },
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
    sellValue: 10,
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
    sellValue: 20,
  },
};

export const WORLD_OBJECTS = {
  WELL: { texture: "tiny_town", frame: { bottom: 104, top: 92 } },
  BIN: { texture: "objects", frame: 37 },
};

export const TOOLS = {
  NONE: { id: 0, label: "None" },
  HOE: { id: 1, label: "Hoe", texture: "tiny_town", frame: 116 },
  BUCKET: { id: 2, label: "Bucket", texture: "tiny_town", frame: 131 },
  SEEDS: { id: 3, label: "Seeds", texture: "objects", frame: 24 },
  SCYTHE: { id: 4, label: "Scythe", texture: "tiny_town", frame: 129 },
};
