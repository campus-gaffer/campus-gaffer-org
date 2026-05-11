package scraper

import "testing"

func TestToForfeitedBy(t *testing.T) {
	tests := []struct {
		name     string
		team1FD  string
		team2FD  string
		want     string
	}{
		{name: "no forfeit (both empty)", team1FD: "", team2FD: "", want: ""},
		{name: "home (team1) forfeits", team1FD: "Forfeit", team2FD: "", want: "home"},
		{name: "away (team2) forfeits", team1FD: "", team2FD: "Forfeit", want: "away"},
		// Per design doc §10.2: any non-empty value is treated as a forfeit
		// until a different value appears in sampled data.
		{name: "non-Forfeit value still triggers (home)", team1FD: "Default", team2FD: "", want: "home"},
		{name: "non-Forfeit value still triggers (away)", team1FD: "", team2FD: "No Show", want: "away"},
		// Edge case: both teams "forfeit" (unobserved in real data, but
		// resolution: home wins the tie since we check it first). This
		// keeps behaviour deterministic without inventing a third state.
		{name: "Both teams forfeit. Home wins tie-break", team1FD: "Forfeit", team2FD: "Forfeit", want: "home"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := toForfeitedBy(tc.team1FD, tc.team2FD)
			if got != tc.want {
				t.Errorf("toForfeitedBy(%q, %q) = %q, want %q", tc.team1FD, tc.team2FD, got, tc.want)
			}
		})
	}
}
