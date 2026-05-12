package season

import (
	"campus-gaffer-backend/internal/models"
	"testing"
	"time"
)

func winnipeg(t *testing.T) *time.Location {
	t.Helper()
	loc, err := time.LoadLocation("America/Winnipeg")
	if err != nil {
		t.Fatalf("LoadLocation: %v", err)
	}
	return loc
}

// game builds a regular-season game with the given UTC kickoff.
func game(t *testing.T, kickoffUTC string) models.Game {
	t.Helper()
	ts, err := time.Parse(time.RFC3339, kickoffUTC)
	if err != nil {
		t.Fatalf("parse %q: %v", kickoffUTC, err)
	}
	return models.Game{ExternalGameType: RegularGameType, KickoffTime: &ts}
}

func playoff(t *testing.T, kickoffUTC string) models.Game {
	t.Helper()
	g := game(t, kickoffUTC)
	g.ExternalGameType = 1
	return g
}

// expectGW asserts the (Number, Start, Cutoff) of a gameweek in local time.
func expectGW(t *testing.T, gw Gameweek, num int, startLocal, cutoffLocal string, loc *time.Location) {
	t.Helper()
	s, _ := time.ParseInLocation("2006-01-02T15:04:05", startLocal, loc)
	c, _ := time.ParseInLocation("2006-01-02T15:04:05", cutoffLocal, loc)
	if gw.Number != num {
		t.Errorf("Number: got %d, want %d", gw.Number, num)
	}
	if !gw.Start.Equal(s) {
		t.Errorf("Start: got %v, want %v", gw.Start, s)
	}
	if !gw.Cutoff.Equal(c) {
		t.Errorf("Cutoff: got %v, want %v", gw.Cutoff, c)
	}
}

func TestRegularGameweeks_Empty(t *testing.T) {
	if got := RegularGameweeks(nil, winnipeg(t)); len(got) != 0 {
		t.Errorf("nil input: got %d gameweeks, want 0", len(got))
	}
}

func TestRegularGameweeks_SingleMondayGame(t *testing.T) {
	// 2026-01-26 14:45 Winnipeg = 2026-01-26 20:45 UTC (UTC-6, no DST).
	gws := RegularGameweeks([]models.Game{game(t, "2026-01-26T20:45:00Z")}, winnipeg(t))
	if len(gws) != 1 {
		t.Fatalf("got %d gameweeks, want 1", len(gws))
	}
	expectGW(t, gws[0], 1, "2026-01-26T00:00:00", "2026-02-01T23:59:59", winnipeg(t))
}

func TestRegularGameweeks_MultipleGamesSameWeek_CollapseToOne(t *testing.T) {
	// Mon Jan 26 + Thu Jan 29: same Mon-Sun block, one Gameweek.
	gws := RegularGameweeks([]models.Game{
		game(t, "2026-01-26T20:45:00Z"),
		game(t, "2026-01-29T20:45:00Z"),
	}, winnipeg(t))
	if len(gws) != 1 {
		t.Fatalf("got %d gameweeks, want 1", len(gws))
	}
}

func TestRegularGameweeks_ByeWeekSkipped(t *testing.T) {
	// Jan 26 (GW1), Feb 2 (GW2), Feb 9 (GW3), [no game Feb 16-22], Feb 23 (GW4).
	// The reading-week gap must produce no Gameweek and Number must not skip.
	loc := winnipeg(t)
	gws := RegularGameweeks([]models.Game{
		game(t, "2026-01-26T20:45:00Z"),
		game(t, "2026-02-02T21:45:00Z"),
		game(t, "2026-02-09T21:45:00Z"),
		game(t, "2026-02-23T21:45:00Z"),
	}, loc)
	if len(gws) != 4 {
		t.Fatalf("got %d gameweeks, want 4", len(gws))
	}
	expectGW(t, gws[0], 1, "2026-01-26T00:00:00", "2026-02-01T23:59:59", loc)
	expectGW(t, gws[1], 2, "2026-02-02T00:00:00", "2026-02-08T23:59:59", loc)
	expectGW(t, gws[2], 3, "2026-02-09T00:00:00", "2026-02-15T23:59:59", loc)
	expectGW(t, gws[3], 4, "2026-02-23T00:00:00", "2026-03-01T23:59:59", loc)
}

func TestRegularGameweeks_PlayoffsFilteredOut(t *testing.T) {
	gws := RegularGameweeks([]models.Game{
		game(t, "2026-01-26T20:45:00Z"),
		playoff(t, "2026-03-16T19:45:00Z"),
	}, winnipeg(t))
	if len(gws) != 1 {
		t.Fatalf("got %d gameweeks, want 1 (playoff filtered)", len(gws))
	}
}

func TestRegularGameweeks_NilKickoffIgnored(t *testing.T) {
	gws := RegularGameweeks([]models.Game{
		{ExternalGameType: RegularGameType, KickoffTime: nil},
		game(t, "2026-01-26T20:45:00Z"),
	}, winnipeg(t))
	if len(gws) != 1 {
		t.Fatalf("got %d gameweeks, want 1", len(gws))
	}
}

func TestRegularGameweeks_OutOfOrderInputSortedOnOutput(t *testing.T) {
	gws := RegularGameweeks([]models.Game{
		game(t, "2026-02-09T21:45:00Z"),
		game(t, "2026-01-26T20:45:00Z"),
		game(t, "2026-02-02T21:45:00Z"),
	}, winnipeg(t))
	if len(gws) != 3 {
		t.Fatalf("got %d gameweeks, want 3", len(gws))
	}
	if !gws[0].Start.Before(gws[1].Start) || !gws[1].Start.Before(gws[2].Start) {
		t.Errorf("output not chronological: %v", gws)
	}
	for i, gw := range gws {
		if gw.Number != i+1 {
			t.Errorf("gws[%d].Number = %d, want %d", i, gw.Number, i+1)
		}
	}
}

func TestRegularGameweeks_LateUTCMondayBucketsLocally(t *testing.T) {
	// 2026-01-27T03:00:00Z is 2026-01-26 21:00 Winnipeg — a Monday game
	// locally. Naive UTC bucketing would put it in GW2 (Tuesday); correct
	// behaviour is GW1 (Monday local).
	gws := RegularGameweeks([]models.Game{game(t, "2026-01-27T03:00:00Z")}, winnipeg(t))
	if len(gws) != 1 {
		t.Fatalf("got %d gameweeks, want 1", len(gws))
	}
	expectGW(t, gws[0], 1, "2026-01-26T00:00:00", "2026-02-01T23:59:59", winnipeg(t))
}

func TestRegularGameweeks_DSTSpringForwardWeek(t *testing.T) {
	// Winnipeg DST starts 2026-03-08 (Sunday) at 02:00 local. A Monday
	// game on 2026-03-09 falls into the GW that runs Mar 9–15. The Sunday
	// cutoff is 2026-03-15 23:59:59 local (post-DST, UTC-5). Verifying
	// AddDate/time.Date arithmetic stays correct across the DST boundary.
	loc := winnipeg(t)
	gws := RegularGameweeks([]models.Game{
		game(t, "2026-03-02T20:45:00Z"), // Mon Mar 2 (pre-DST, 14:45 local)
		game(t, "2026-03-09T19:45:00Z"), // Mon Mar 9 (post-DST, 14:45 local)
	}, loc)
	if len(gws) != 2 {
		t.Fatalf("got %d gameweeks, want 2", len(gws))
	}
	// Pre-DST week: cutoff Sun Mar 8 23:59:59 Winnipeg (UTC-6 pre-DST, but
	// the transition at 02:00 Sun is well before 23:59:59 so the cutoff is
	// resolved post-DST as UTC-5).
	expectGW(t, gws[0], 1, "2026-03-02T00:00:00", "2026-03-08T23:59:59", loc)
	expectGW(t, gws[1], 2, "2026-03-09T00:00:00", "2026-03-15T23:59:59", loc)
}
