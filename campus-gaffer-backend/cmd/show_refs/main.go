package main

import (
	"campus-gaffer-backend/internal/database"
	"fmt"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.Connect()

	var divisions []struct{ ID string }
	database.DB.Table("divisions").Select("id").Find(&divisions)
	fmt.Println("Divisions:")
	for _, d := range divisions {
		fmt.Printf("  %q\n", d.ID)
	}

	var teams []struct{ ID string }
	database.DB.Table("teams").Select("id").Find(&teams)
	fmt.Println("Teams:")
	for _, t := range teams {
		fmt.Printf("  %q\n", t.ID)
	}
}
