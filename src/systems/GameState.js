// src/systems/GameState.js
import { DAY_SETTINGS } from "../config/WorldConfig";

export class GameState {
  constructor() {
    this.gold = 0;
    this.water = 10;
    this.maxWater = 10;
    this.inventory = [];

    this.day = DAY_SETTINGS.startingDay;
    this.dayTime = DAY_SETTINGS.dayTime;
    this.dayTimer = 0;
    this.isDayActive = true;
    this.quota = DAY_SETTINGS.startingQuota;
    this.gameOver = false;
  }

  /**
   * Advance the active day timer and report when the day should end.
   */
  updateDay(delta) {
    if (!this.isDayActive || this.gameOver) return false;

    this.dayTimer += delta;
    return this.dayTimer >= this.dayTime;
  }

  /**
   * Resolve the quota payment and either advance the day or end the run.
   */
  endDay() {
    if (this.gold < this.quota) {
      this.gameOver = true;
      this.isDayActive = false;
      return {
        success: false,
        message: `Failed to pay quota! Needed ${this.quota}g, had ${this.gold}g. Game Over!`,
      };
    }

    const paidQuota = this.quota;
    this.gold -= paidQuota;
    this.quota += DAY_SETTINGS.quotaIncrease;
    this.day++;
    this.dayTimer = 0;
    this.water = this.maxWater;
    this.isDayActive = true;

    return {
      success: true,
      message: `Paid quota of ${paidQuota}g. Remaining gold: ${this.gold}g`,
      nextDayMessage: `Day ${this.day} started! New quota: ${this.quota}g`,
    };
  }

  /**
   * Restore the bucket to its maximum water capacity.
   */
  refillWater() {
    this.water = this.maxWater;
  }

  /**
   * Consume one unit of water if any is available.
   */
  spendWater() {
    if (this.water <= 0) return false;

    this.water--;
    return true;
  }

  /**
   * Add a harvested crop to the pending shipment inventory.
   */
  storeHarvest(harvestedCrop) {
    this.inventory.push(harvestedCrop);
  }

  /**
   * Sell every stored crop and return the gold earned.
   */
  sellInventory() {
    const totalGain = this.inventory.reduce(
      (total, item) => total + item.sellValue,
      0,
    );
    this.gold += totalGain;
    this.inventory = [];
    return totalGain;
  }
}
