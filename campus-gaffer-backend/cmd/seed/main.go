// cmd/seed/main.go — populate the dev DB with fake squads for a realistic leaderboard.
//
// Usage:
//
//	go run ./cmd/seed            # seed 30 squads (idempotent)
//	go run ./cmd/seed -n 50      # seed 50 squads
//	go run ./cmd/seed -wipe      # delete all seed_user_* data then exit
//	go run ./cmd/seed -wipe -n 40  # wipe then re-seed 40 squads
//
// Seed users get IDs like "seed_user_0001" — distinct from Clerk IDs (user_2xxx), easy to clean up.
// Running twice is safe: ON CONFLICT DO NOTHING skips already-inserted rows.
// player_game_points is NOT touched — points flow from real scoring data, same as a real user.
package main

import (
	"flag"
	"fmt"
	"log"
	"math/rand"
	"time"

	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var firstNames = []string{
	"Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Quinn",
	"Drew", "Avery", "Blake", "Cameron", "Dana", "Ellis", "Finley", "Gray",
	"Harper", "Indigo", "Jamie", "Keiran", "Luca", "Mia", "Noah", "Olive",
	"Parker", "Remy", "Scout", "Toby", "Uma", "Wren",
}

var lastNames = []string{
	"Ahmed", "Brown", "Carter", "Davis", "Evans", "Fisher", "Garcia", "Hall",
	"Ibrahim", "Jensen", "Khan", "Lee", "Moyo", "Nguyen", "Osei", "Patel",
	"Quinn", "Reyes", "Singh", "Torres", "Usman", "Vega", "Williams", "Xavier",
	"Yilmaz", "Zhang", "Anderson", "Bell", "Chen", "Dubois",
}

func seedUsername(i int) string {
	first := firstNames[i%len(firstNames)]
	last := lastNames[(i/len(firstNames))%len(lastNames)]
	return first + last
}

func main() {
	n := flag.Int("n", 30, "number of squads to seed")
	wipe := flag.Bool("wipe", false, "delete all seed_user_* data before seeding (alone = wipe only)")
	flag.Parse()

	dbURI := database.LoadDBUri()
	db := database.Connect(dbURI)

	if *wipe {
		log.Println("wiping seed data…")
		must(db.Exec(`
			DELETE FROM squad_players
			WHERE squad_id IN (
				SELECT s.id FROM squads s
				JOIN users u ON u.id = s.user_id
				WHERE u.id LIKE 'seed_user_%'
			)
		`).Error)
		must(db.Exec(`
			DELETE FROM squads
			WHERE user_id IN (SELECT id FROM users WHERE id LIKE 'seed_user_%')
		`).Error)
		must(db.Exec(`DELETE FROM users WHERE id LIKE 'seed_user_%'`).Error)
		log.Println("wipe complete")

		nExplicit := false
		flag.Visit(func(f *flag.Flag) {
			if f.Name == "n" {
				nExplicit = true
			}
		})
		if !nExplicit {
			return
		}
	}

	var players []models.Player
	must(db.Select("id").Find(&players).Error)
	if len(players) < 10 {
		log.Fatalf("need at least 10 players in DB (found %d)", len(players))
	}
	playerIDs := make([]uuid.UUID, len(players))
	for i, p := range players {
		playerIDs[i] = p.Id
	}

	gameweek := resolveGameweek(db)
	log.Printf("seeding into gameweek %d with %d players available", gameweek, len(players))

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	seeded := 0

	for i := 0; i < *n; i++ {
		userID := fmt.Sprintf("seed_user_%04d", i+1)
		username := seedUsername(i)
		email := fmt.Sprintf("seed_%04d@campus-gaffer.test", i+1)

		user := models.User{ID: userID, Username: username, Email: email}
		if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&user).Error; err != nil {
			log.Printf("user %s: %v — skipping", userID, err)
			continue
		}

		squad := models.Squad{
			Id:          uuid.New(),
			UserID:      userID,
			Gameweek:    gameweek,
			BudgetSpent: 50.0 + rng.Float64()*15.0,
		}
		if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&squad).Error; err != nil {
			log.Printf("squad for %s: %v — skipping", userID, err)
			continue
		}

		// 6 starters + 4 bench = 10 distinct players, same as a real user drafting via the UI.
		perm := rng.Perm(len(playerIDs))
		for j := 0; j < 10 && j < len(playerIDs); j++ {
			sp := models.SquadPlayer{
				Id:       uuid.New(),
				SquadId:  squad.Id,
				PlayerId: playerIDs[perm[j]],
				IsBench:  j >= 6,
			}
			db.Clauses(clause.OnConflict{DoNothing: true}).Create(&sp)
		}

		log.Printf("seeded: %-20s (%s)", username, userID)
		seeded++
	}

	log.Printf("\ndone. inserted %d/%d squads.", seeded, *n)
}

func resolveGameweek(db *gorm.DB) int {
	type result struct{ GW int }
	var r result
	db.Raw(`
		SELECT COALESCE(MAX(gw_num), 1) AS gw
		FROM (
			SELECT DENSE_RANK() OVER (ORDER BY DATE_TRUNC('week', kickoff_time)) AS gw_num
			FROM games
			WHERE kickoff_time < NOW()
		) t
	`).Scan(&r)
	if r.GW == 0 {
		return 1
	}
	return r.GW
}

func must(err error) {
	if err != nil {
		log.Fatalf("fatal: %v", err)
	}
}
