// src/systems/GameState.js
import { DAY_SETTINGS } from "../config/WorldConfig";
import { CROP_TYPES } from "../constants";

export class GameState {
  constructor() {
    this.gold = 0;
    this.water = 10;
    this.maxWater = 10;
    this.inventory = [];
    this.todayShippedValue = 0;

    this.day = DAY_SETTINGS.startingDay;
    this.dayTime = DAY_SETTINGS.dayTime;
    this.dayTimer = 0;
    this.isDayActive = true;
    this.quota = DAY_SETTINGS.startingQuota;
    this.gameOver = false;

    this.cropOrder = Object.keys(CROP_TYPES);
    this.selectedCropIndex = this.cropOrder.indexOf("CORN");
    this.selectedCropKey = this.cropOrder[this.selectedCropIndex];
  }

  updateDay(delta) {
    if (!this.isDayActive || this.gameOver) return false;

    this.dayTimer += delta;
    return this.dayTimer >= this.dayTime;
  }

  /**
   * End the day by checking production against the quota, then either start
   * the next day or freeze the run in a game-over state.
   */
  endDay() {
    if (this.todayShippedValue < this.quota) {
      this.gameOver = true;
      this.isDayActive = false;
      return {
        success: false,
        message: `Failed to pay quota!\nNeeded ${this.quota}g shipped today,\nshipped ${this.todayShippedValue}g.\nGame Over!`,
      };
    }

    const paidQuota = this.quota;
    this.gold -= paidQuota;
    this.quota += DAY_SETTINGS.quotaIncrease;
    this.day++;
    this.dayTimer = 0;
    this.water = this.maxWater;
    this.todayShippedValue = 0;
    this.isDayActive = true;

    return {
      success: true,
      message: `Paid quota of ${paidQuota}g.\nRemaining gold: ${this.gold}g`,
      nextDayMessage: `Day ${this.day} started!\nNew quota: ${this.quota}g`,
    };
  }

  refillWater() {
    this.water = this.maxWater;
  }

  spendWater() {
    if (this.water <= 0) return false;

    this.water--;
    return true;
  }

  /**
   * @param {number} direction Positive for next crop, negative for previous crop.
   */
  cycleSelectedCrop(direction) {
    this.selectedCropIndex =
      (this.selectedCropIndex + direction + this.cropOrder.length) %
      this.cropOrder.length;

    this.selectedCropKey = this.cropOrder[this.selectedCropIndex];
  }

  storeHarvest(harvestedCrop) {
    this.inventory.push(harvestedCrop);
  }

  /**
   * Shipping increases both the wallet and today's quota progress.
   */
  sellInventory() {
    const totalGain = this.inventory.reduce(
      (total, item) => total + item.sellValue,
      0,
    );
    this.gold += totalGain;
    this.todayShippedValue += totalGain;
    this.inventory = [];
    return totalGain;
  }
}
