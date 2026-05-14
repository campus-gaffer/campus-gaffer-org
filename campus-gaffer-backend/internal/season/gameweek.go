// Package season derives the regular-season gameweek schedule from
// scheduled games. The pricing pipeline uses it to map between
// (gameweek_number, kickoff_cutoff) pairs so callers don't have to
// hand-compute Sunday timestamps.
package season

import (
	"sort"
	"time"

	"campus-gaffer-backend/internal/models"
)

// RegularGameType is the games.external_game_type value that identifies
// regular-season games. Playoff games (== 1) are excluded from pricing.
const RegularGameType int16 = 0

// Gameweek represents one regular-season week in the league's local
// timezone. Number is sequential over weeks that contain at least one
// regular game (bye weeks produce no Gameweek).
//
// Cutoff is Sunday 23:59:59 local — the deadline for fantasy managers to
// finalise picks for the *following* gameweek, and the instant at which
// prices for this gameweek are computed.
type Gameweek struct {
	Number int
	Start  time.Time // Monday 00:00:00 local
	Cutoff time.Time // Sunday 23:59:59 local
}

// RegularGameweeks computes the gameweek schedule from the given games.
// Only games with ExternalGameType == RegularGameType and a non-nil
// KickoffTime are considered. Output is chronological, numbered from 1.
// Weeks with no scheduled game are skipped (no record), so Number is
// dense over playable weeks.
func RegularGameweeks(games []models.Game, loc *time.Location) []Gameweek {
	seen := map[time.Time]bool{}
	mondays := make([]time.Time, 0)
	for _, g := range games {
		if g.ExternalGameType != RegularGameType || g.KickoffTime == nil {
			continue
		}
		monday := mondayOf(g.KickoffTime.In(loc))
		if !seen[monday] {
			seen[monday] = true
			mondays = append(mondays, monday)
		}
	}
	sort.Slice(mondays, func(i, j int) bool { return mondays[i].Before(mondays[j]) })

	weeks := make([]Gameweek, len(mondays))
	for i, m := range mondays {
		weeks[i] = Gameweek{
			Number: i + 1,
			Start:  m,
			Cutoff: time.Date(m.Year(), m.Month(), m.Day()+6, 23, 59, 59, 0, m.Location()),
		}
	}
	return weeks
}

// mondayOf returns Monday 00:00:00 of the local calendar week containing
// t. The result is in t's location so that DST transitions inside the
// week are respected by downstream wall-clock arithmetic.
func mondayOf(t time.Time) time.Time {
	// Go's Weekday: Sunday=0, Monday=1, ..., Saturday=6.
	// Shift so Monday=0, ..., Sunday=6 → offset to subtract for Monday.
	offset := (int(t.Weekday()) - 1 + 7) % 7
	return time.Date(t.Year(), t.Month(), t.Day()-offset, 0, 0, 0, 0, t.Location())
}
