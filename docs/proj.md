# PROJECT: Farm Game (Phaser/JS)

## CORE CONCEPT

Top-down farming sim: Move, till, plant, water, harvest crops. Sell at bin, refill water at well. Now adding day-based progression.

## CURRENT STATUS

- Movement + facing-based interactions
- Tile states (dirt, tilled, watered)
- Crop growth stages + harvesting
- Well refill, shipping bin, inventory
- Basic UI text (gold, water, tool)
- Debug grid overlay

## GAME LOOP (NEW FOCUS)

- Day timer: 60s active play, then end-of-day harvest/shipping
- Progression: Track days, gold accumulation
- Goals: Daily crop targets, gold milestones
- Polish: Better UI feedback, crop visuals

## NEXT PRIORITIES

1. Implement day timer + end-of-day logic
2. Add automatic crop harvesting at day end
3. Improve UI (on-screen prompts, tool icons)
4. Add simple win conditions (e.g., reach 500g)

## LATER IDEAS

- Seasons affecting growth rates
- Pest events
- Multiple crop types
- Save/load progress
