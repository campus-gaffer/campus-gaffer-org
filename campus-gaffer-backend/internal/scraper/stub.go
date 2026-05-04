package scraper

import "context"

// FakeScraper is a configurable test double that implements Scraper,
// DiscoveryScraper, and StatsScraper. Populate the fixture fields before
// passing it to a service under test; no HTTP requests are made.
//
// Usage:
//
//	fake := scraper.NewFakeScraper()
//	fake.Games = []scraper.ScrapedGameSummary{{...}}
//	fake.Stats["game-1"] = &scraper.ScrapedGameDetails{...}
//	svc := service.NewGameService(fake, fake, ...)
type FakeScraper struct {
	// Fixture data returned by each method.
	Games   []ScrapedGameSummary
	Stats   map[string]*ScrapedGameDetails // keyed by ExternalId
	Players map[string]*ScrapedPlayerInfo  // keyed by ExternalId (player)

	// Error injection — when set, the corresponding method returns this error
	// instead of fixture data.
	DiscoverErr   error
	GameDataErr   error
	PlayerDataErr error

	// Call counters — assert how many times each method was invoked.
	DiscoverCalls   int
	GameDataCalls   map[string]int // keyed by externalId
	PlayerDataCalls map[string]int // keyed by playerId
}

// NewFakeScraper returns a FakeScraper with all maps initialised.
func NewFakeScraper() *FakeScraper {
	return &FakeScraper{
		Stats:           make(map[string]*ScrapedGameDetails),
		Players:         make(map[string]*ScrapedPlayerInfo),
		GameDataCalls:   make(map[string]int),
		PlayerDataCalls: make(map[string]int),
	}
}

func (f *FakeScraper) Name() string { return "fake" }

func (f *FakeScraper) Discover(_ context.Context) ([]ScrapedGameSummary, error) {
	f.DiscoverCalls++
	if f.DiscoverErr != nil {
		return nil, f.DiscoverErr
	}
	return f.Games, nil
}

func (f *FakeScraper) GetGameData(_ context.Context, externalId string) (*ScrapedGameDetails, error) {
	f.GameDataCalls[externalId]++
	if f.GameDataErr != nil {
		return nil, f.GameDataErr
	}
	d, ok := f.Stats[externalId]
	if !ok {
		return nil, &ErrParseFailed{msg: "no fixture data for game", id: externalId}
	}
	return d, nil
}

func (f *FakeScraper) GetPlayerData(_ context.Context, playerId string) (*ScrapedPlayerInfo, error) {
	f.PlayerDataCalls[playerId]++
	if f.PlayerDataErr != nil {
		return nil, f.PlayerDataErr
	}
	p, ok := f.Players[playerId]
	if !ok {
		return nil, &ErrParseFailed{msg: "no fixture data for player", id: playerId}
	}
	return p, nil
}
