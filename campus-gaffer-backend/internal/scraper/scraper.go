package scraper

import "context"

// Scraper is the base marker interface — all scrapers have a name.
type Scraper interface {
	Name() string
}

// DiscoveryScraper fetches the full season schedule and returns a
// deduplicated list of game summaries. Callers receive a flat slice;
// any source-specific pagination or multi-team iteration is an
// implementation detail hidden behind this interface.
type DiscoveryScraper interface {
	GetLeagueTeams(ctx context.Context) ([]ScrapedTeamItem, error)
	GetCurrentSeasonGames(ctx context.Context, teamId string) ([]ScrapedGameSummary, error)
}

// StatsScraper fetches per-game statistics and player biographical data.
// GetGameData requires that Discover has been called first on the same
// instance — implementations cache game routing metadata during discovery
// and use it to build the per-game request.
type StatsScraper interface {
	//GetGameData(ctx context.Context, externalId string) (*ScrapedGameDetails, error)
	GetGameData(ctx context.Context, ref GameRef) (*ScrapedGameDetails, error)
	GetPlayerData(ctx context.Context, playerId string) (*ScrapedPlayerInfo, error)
}
