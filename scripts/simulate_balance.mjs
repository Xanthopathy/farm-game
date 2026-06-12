const SETTINGS = {
  days: 10,
  dayMs: 60000,
  effectiveWorkMs: 45000,
  actionMs: 1500,
  waterPerDay: 10,
  startingGold: 0,
  startingQuota: 40,
  quotaIncrease: 30,
  startingSeeds: {
    TURNIP: 10,
  },
  fieldTiles: 180,
};

const ACTIONS = {
  till: 1,
  plant: 1,
  water: 1,
  harvest: 1,
};

const CROPS = {
  TURNIP: {
    name: "Turnip",
    stages: 5,
    growthTime: 2000,
    seedCost: 2,
    sellValue: 6,
  },
  WHEAT: {
    name: "Wheat",
    stages: 7,
    growthTime: 2500,
    seedCost: 3,
    sellValue: 8,
  },
  GARLIC: {
    name: "Garlic",
    stages: 5,
    growthTime: 4000,
    seedCost: 5,
    sellValue: 12,
  },
  CORN: {
    name: "Corn",
    stages: 6,
    growthTime: 4500,
    seedCost: 6,
    sellValue: 15,
  },
  PUMPKIN: {
    name: "Pumpkin",
    stages: 6,
    growthTime: 7000,
    seedCost: 10,
    sellValue: 26,
  },
};

const STRATEGIES = {
  allTurnip: ["TURNIP"],
  allWheat: ["WHEAT"],
  allGarlic: ["GARLIC"],
  allCorn: ["CORN"],
  allPumpkin: ["PUMPKIN"],
  safeMix: ["TURNIP", "WHEAT", "GARLIC"],
  greedyMix: ["PUMPKIN", "CORN", "GARLIC"],
  balancedMix: ["TURNIP", "WHEAT", "GARLIC", "CORN", "PUMPKIN"],
};

const formatGold = (value) => `${value}g`;
const matureTime = (crop) => crop.growthTime * (crop.stages - 1);
const actionCostMs = (actions) => actions * SETTINGS.actionMs;
const quotaForDay = (day) =>
  SETTINGS.startingQuota + SETTINGS.quotaIncrease * (day - 1);

class Plot {
  constructor(cropKey) {
    this.cropKey = cropKey;
    this.remainingGrowMs = matureTime(CROPS[cropKey]);
  }

  get isMature() {
    return this.remainingGrowMs <= 0;
  }

  grow(deltaMs) {
    this.remainingGrowMs = Math.max(0, this.remainingGrowMs - deltaMs);
  }
}

const createState = () => ({
  gold: SETTINGS.startingGold,
  seeds: { ...SETTINGS.startingSeeds },
  plots: [],
  tilledEmptyTiles: 0,
  untilledTiles: SETTINGS.fieldTiles,
  strategyCursor: 0,
  survivedDays: 0,
});

const chooseCrop = (state, cropKeys) => {
  const starterCropKey = Object.keys(state.seeds).find(
    (cropKey) => state.seeds[cropKey] > 0,
  );

  if (starterCropKey) {
    return starterCropKey;
  }

  const cropKey = cropKeys[state.strategyCursor % cropKeys.length];
  state.strategyCursor++;
  return cropKey;
};

const advanceTime = (state, budget, elapsedMs) => {
  budget.timeMs += elapsedMs;
  state.plots.forEach((plot) => plot.grow(elapsedMs));
};

const canSpendWork = (budget, workMs) => {
  return (
    budget.timeMs + workMs <= SETTINGS.dayMs &&
    budget.workMs + workMs <= SETTINGS.effectiveWorkMs
  );
};

const spendActionTime = (state, budget, workMs) => {
  budget.workMs += workMs;
  advanceTime(state, budget, workMs);
};

const getFirstMaturePlotIndex = (state) => {
  return state.plots.findIndex((plot) => plot.isMature);
};

const canPlantCrop = (state, budget, cropKey) => {
  const crop = CROPS[cropKey];
  const hasStarterSeed = (state.seeds[cropKey] ?? 0) > 0;
  const needsTill = state.tilledEmptyTiles <= 0;
  const actions = ACTIONS.plant + ACTIONS.water + (needsTill ? ACTIONS.till : 0);
  const workCostMs = actionCostMs(actions);

  return (
    budget.water > 0 &&
    canSpendWork(budget, workCostMs) &&
    (hasStarterSeed || state.gold >= crop.seedCost) &&
    (!needsTill || state.untilledTiles > 0)
  );
};

const simulateDay = (state, cropKeys, day) => {
  const budget = {
    timeMs: 0,
    workMs: 0,
    water: SETTINGS.waterPerDay,
  };
  const quota = quotaForDay(day);
  const startGold = state.gold;
  let harvestedCount = 0;
  let shippedValue = 0;
  let plantedCount = 0;
  let seedSpend = 0;
  let freeSeedsUsed = 0;

  while (budget.timeMs < SETTINGS.dayMs) {
    const matureIndex = getFirstMaturePlotIndex(state);
    const harvestMs = actionCostMs(ACTIONS.harvest);

    if (matureIndex !== -1 && canSpendWork(budget, harvestMs)) {
      const [plot] = state.plots.splice(matureIndex, 1);
      spendActionTime(state, budget, harvestMs);
      harvestedCount++;
      shippedValue += CROPS[plot.cropKey].sellValue;
      state.gold += CROPS[plot.cropKey].sellValue;
      state.tilledEmptyTiles++;
      continue;
    }

    const cropKey = chooseCrop(state, cropKeys);
    if (canPlantCrop(state, budget, cropKey)) {
      const crop = CROPS[cropKey];
      const hasStarterSeed = (state.seeds[cropKey] ?? 0) > 0;
      const needsTill = state.tilledEmptyTiles <= 0;
      const actions =
        ACTIONS.plant + ACTIONS.water + (needsTill ? ACTIONS.till : 0);
      const workCostMs = actionCostMs(actions);

      spendActionTime(state, budget, workCostMs);
      budget.water--;
      plantedCount++;

      if (hasStarterSeed) {
        state.seeds[cropKey]--;
        freeSeedsUsed++;
      } else {
        state.gold -= crop.seedCost;
        seedSpend += crop.seedCost;
      }

      if (needsTill) {
        state.untilledTiles--;
      } else {
        state.tilledEmptyTiles--;
      }

      state.plots.push(new Plot(cropKey));
      continue;
    }

    const nextMatureMs = Math.min(
      ...state.plots
        .filter((plot) => !plot.isMature)
        .map((plot) => plot.remainingGrowMs),
    );

    if (!Number.isFinite(nextMatureMs)) break;

    const waitMs = Math.min(nextMatureMs, SETTINGS.dayMs - budget.timeMs);
    advanceTime(state, budget, waitMs);
  }

  const passed = shippedValue >= quota && state.gold >= quota;
  if (passed) {
    state.gold -= quota;
    state.survivedDays = day;
  }

  return {
    day,
    quota,
    passed,
    startGold,
    seedSpend,
    freeSeedsUsed,
    planted: plantedCount,
    harvested: harvestedCount,
    shipped: shippedValue,
    endGold: state.gold,
    fieldCrops: state.plots.length,
    matureInField: state.plots.filter((plot) => plot.isMature).length,
    workLeftSec: Math.round((SETTINGS.effectiveWorkMs - budget.workMs) / 1000),
    waterLeft: budget.water,
  };
};

const simulateStrategy = (name, cropKeys) => {
  const state = createState();
  const rows = [];

  for (let day = 1; day <= SETTINGS.days; day++) {
    const row = simulateDay(state, cropKeys, day);
    rows.push(row);
    if (!row.passed) break;
  }

  return {
    name,
    rows,
    survivedDays: state.survivedDays,
    finalGold: state.gold,
  };
};

const printStrategy = (result) => {
  console.log(`\n=== ${result.name} ===`);
  console.log(
    "Day | Quota | Ship | Pass | Start | Spend | Free | End | Plant | Harv | Field | Mature",
  );

  result.rows.forEach((row) => {
    console.log(
      [
        String(row.day).padStart(3),
        formatGold(row.quota).padStart(5),
        formatGold(row.shipped).padStart(5),
        String(row.passed ? "Y" : "N").padStart(4),
        formatGold(row.startGold).padStart(5),
        formatGold(row.seedSpend).padStart(5),
        String(row.freeSeedsUsed).padStart(4),
        formatGold(row.endGold).padStart(5),
        String(row.planted).padStart(5),
        String(row.harvested).padStart(4),
        String(row.fieldCrops).padStart(5),
        String(row.matureInField).padStart(6),
      ].join(" | "),
    );
  });

  console.log(
    `Survived ${result.survivedDays}/${SETTINGS.days} days, final gold ${formatGold(result.finalGold)}`,
  );
};

const printCropSummary = () => {
  console.log("Crop balance draft:");
  Object.entries(CROPS).forEach(([key, crop]) => {
    console.log(
      `${key.padEnd(7)} mature=${Math.round(matureTime(crop) / 1000)
        .toString()
        .padStart(2)}s seed=${formatGold(crop.seedCost).padStart(4)} sell=${formatGold(crop.sellValue).padStart(4)} profit=${formatGold(crop.sellValue - crop.seedCost).padStart(4)}`,
    );
  });
};

printCropSummary();
console.log("\nSettings:", SETTINGS);

Object.entries(STRATEGIES)
  .map(([name, cropKeys]) => simulateStrategy(name, cropKeys))
  .forEach(printStrategy);
