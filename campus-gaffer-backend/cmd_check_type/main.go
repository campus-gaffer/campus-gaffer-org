package main

import (
	"campus-gaffer-backend/internal/database"
	"fmt"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.Connect()
	var dtype string
	database.DB.Raw("SELECT data_type FROM information_schema.columns WHERE table_name = 'player_data' AND column_name = 'id'").Scan(&dtype)
	fmt.Printf("PLAYER_DATA ID TYPE: %s\n", dtype)
}
