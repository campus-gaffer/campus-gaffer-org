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

	// Check columns of player_data
	var columns []string
	database.DB.Raw("SELECT column_name FROM information_schema.columns WHERE table_name = 'player_data'").Scan(&columns)
	fmt.Printf("PLAYER_DATA COLUMNS: %v\n", columns)

	// Check if squad_members exists
	var tables []string
	database.DB.Raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'").Scan(&tables)
	fmt.Printf("DATABASE TABLES: %v\n", tables)

	// TRY AutoMigrate manually
	err := database.DB.AutoMigrate(&models.SquadMember{})
	if err != nil {
		fmt.Printf("❌ AutoMigrate SQUAD Failed: %v\n", err)
	} else {
		fmt.Printf("✅ AutoMigrate SQUAD OK\n")
	}
}
