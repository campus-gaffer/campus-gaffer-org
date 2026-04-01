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
	var users []models.User
	database.DB.Find(&users)
	fmt.Printf("TOTAL USERS: %d\n", len(users))
	for _, u := range users {
		fmt.Printf("[%s] %s (Team: %s)\n", u.ClerkID, u.Username, u.TeamName)
	}
}
