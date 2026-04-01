package main

import (
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"
	"log"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.Connect()

	// Migrate FRESH with correct UUID schema
	err := database.DB.AutoMigrate(&models.Player{}, &models.User{}, &models.SquadMember{}, &models.Match{})
	if err != nil {
		log.Fatalf("AutoMigrate Failed: %v", err)
	}

	log.Printf("✅ DB Reset & Re-migrated to UUID Schema OK")

	log.Printf("✅ DB Reset & Re-migrated to UUID Schema OK")
}
