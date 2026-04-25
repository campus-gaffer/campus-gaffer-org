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
	err := database.DB.AutoMigrate(&models.Game{})
	if err != nil {
		fmt.Printf("AutoMigrate Game failed: %v\n", err)
	} else {
		fmt.Println("Game model migrated OK (unique index added)")
	}
}
