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
	var squads []models.SquadMember
	database.DB.Find(&squads)
	fmt.Printf("TOTAL SQUAD MEMBERS: %d\n", len(squads))
	for _, s := range squads {
		fmt.Printf("[%s] Player: %s (Captain: %v)\n", s.ClerkID, s.PlayerID, s.IsCaptain)
	}
}
