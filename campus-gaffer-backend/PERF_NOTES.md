# Perf Notes

## `/players` hot path (May 17, 2026)

Observed slow SQL in API logs:

```sql
SELECT * FROM "games"
WHERE external_game_type = 0 AND kickoff_time IS NOT NULL
ORDER BY kickoff_time ASC;
```

### Why it can happen on a single API instance
- `/players` uses process-local cache and a periodic refresh check.
- On refresh windows (or startup), gameweek computation reads regular-season games.
- Even with one instance, you can still see occasional first-hit slow queries depending on DB/cache warmness.

### Reverted optimization (not active now)
A patch was tested and then reverted on request:
- Added a 5-minute in-repo cache for `FindRegularSeason`.
- Reduced selected columns to `kickoff_time, external_game_type`.
- Invalidated that cache on game upsert.

### If needed later
Reapply as a guarded optimization in `internal/repository/game_repository.go`.
Also consider DB index:

```sql
CREATE INDEX CONCURRENTLY idx_games_regular_kickoff
ON games (kickoff_time)
WHERE external_game_type = 0 AND kickoff_time IS NOT NULL;
```

And consider removing N+1 price lookups in `/players` by batch-fetching prices.
