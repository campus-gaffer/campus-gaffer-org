package main

import (
	"campus-gaffer-backend/internal/database"
	"fmt"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.Connect()
	
	// Drop existing index if any (by any name)
	database.DB.Exec("DROP INDEX IF EXISTS idx_games_external_id")
	database.DB.Exec("DROP INDEX IF EXISTS uni_games_external_id")
	database.DB.Exec("DROP INDEX IF EXISTS idx_game_external")
	
	// Create the composite unique index
	err := database.DB.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_game_external ON games (external_id, external_source)").Error
	if err != nil {
		fmt.Printf("Failed to create index: %v\n", err)
	} else {
		fmt.Println("Unique index idx_game_external created successfully")
	}
}
