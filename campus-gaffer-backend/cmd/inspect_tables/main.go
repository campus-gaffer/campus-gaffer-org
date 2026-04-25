package main

import (
	"campus-gaffer-backend/internal/database"
	"fmt"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.Connect()

	tables := []string{"games", "games_data", "divisions", "teams"}
	for _, table := range tables {
		var count int64
		database.DB.Table(table).Count(&count)
		fmt.Printf("%s: %d rows\n", table, count)

		// Show column info
		var columns []struct {
			ColumnName string `gorm:"column:column_name"`
			DataType   string `gorm:"column:data_type"`
		}
		database.DB.Raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ?", table).Scan(&columns)
		for _, c := range columns {
			fmt.Printf("  - %s (%s)\n", c.ColumnName, c.DataType)
		}
		fmt.Println()
	}
}
