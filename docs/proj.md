# PROJECT: 5-DAY FARMING SPRINT (JS/PHASER)

## CORE CONCEPT

A top-down 2D farming game focused on a grid-based growth cycle. The player uses WASD to move and interacts with tiles to till, plant, water, and harvest crops.

## TECHNICAL SPECIFICATIONS

Environment: Web browser (HTML5/JavaScript)

Engine: Phaser 4 (Arcade Physics)

Deployment: GitHub Pages (Static hosting)

Art Style: 16x16 or 32x32 pixel art

Perspective: Top-down (no gravity)

## GRID SYSTEM LOGIC

The world is a 2D array of tile objects.

Each tile tracks its own state: Type (grass, tilled, watered), Crop (none, carrot, wheat), and Growth (0-100).

Player coordinates are mapped to grid indices using Math.floor(pos / tileSize).

## GAMEPLAY MECHANICS

WASD Movement: Free-roaming movement with 0 gravity.

Tilling: Change grass tiles to dirt via interaction key.

Planting/Watering: Add crops to tiles; crops only progress when soil is watered.

Growth Loop: A timer or "tick" system that updates crop states every second.

Harvesting: Collecting ripe crops to increase a score/inventory.

## PLANNED FEATURES (5-DAY TARGET)

Day 1: Movement, canvas setup, and visual grid rendering.

Day 2: State machine for tiles (Tilled/Planted/Watered logic).

Day 3: Growth timer logic and multiple growth stages for sprites.

Day 4: Game loop elements (Shipping bin for gold, water well refill, or crow pests).

Day 5: UI (Gold/Water counters), polish, and GitHub deployment.

## ASSET PLAN

Use free 16x16 asset packs or AI-generated sprite sheets.

Rendering must use "pixelated" scaling to maintain crisp edges.
