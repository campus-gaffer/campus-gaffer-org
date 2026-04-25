package main

import (
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"
	"fmt"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.Connect()

	match := models.Match{
		HomeTeam:    "WOLVES FC",
		AwayTeam:    "CITY RAIDERS",
		HomeScore:   2,
		AwayScore:   1,
		IsLive:      true,
		MatchTime:   "65'",
		Venue:       "CENTRAL PITCH 1",
		PossessionH: 55,
		PossessionA: 45,
		ShotsH:      8,
		ShotsA:      3,
	}
	database.DB.Create(&match)
	fmt.Printf("Match seeded! ID: %d\n", match.ID)
}
