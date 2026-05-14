package database

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() *gorm.DB {
	db_url := os.Getenv("DATABASE_URL")
	var err error
	db, err := gorm.Open(postgres.Open(db_url), &gorm.Config{})

	if err != nil {
		log.Fatal("Failed to connect to Neon")
	}

	log.Println("Connected to Neon")
	DB = db

	// Clear PgBouncer cached plans so schema changes from AutoMigrate don't break
	DB.Exec("DISCARD ALL")

	return DB
}
