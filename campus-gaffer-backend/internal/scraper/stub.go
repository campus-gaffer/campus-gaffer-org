package scraper

import "context"

// FakeScraper is a configurable test double that implements Scraper and
// StatsScraper. Populate the fixture fields before passing it to a
// service under test; no HTTP requests are made.
//
// Usage:
//
//	fake := scraper.NewFakeScraper()
//	fake.Stats["game-1"] = &scraper.ScrapedGameDetails{...}
//	svc := service.NewGameService(nil, fake, ...)
type FakeScraper struct {
	// Fixture data returned by each method.
	Stats   map[string]*ScrapedGameDetails // keyed by GameRef.ExternalId
	Players map[string]*ScrapedPlayerInfo  // keyed by ExternalId (player)

	// Error injection — when set, the corresponding method returns this error
	// instead of fixture data.
	GameDataErr   error
	PlayerDataErr error

	// Call counters — assert how many times each method was invoked.
	GameDataCalls   map[string]int // keyed by GameRef.ExternalId
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

func (f *FakeScraper) GetGameData(_ context.Context, ref GameRef) (*ScrapedGameDetails, error) {
	f.GameDataCalls[ref.ExternalId]++
	if f.GameDataErr != nil {
		return nil, f.GameDataErr
	}
	d, ok := f.Stats[ref.ExternalId]
	if !ok {
		return nil, &ErrParseFailed{msg: "no fixture data for game", id: ref.ExternalId}
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
