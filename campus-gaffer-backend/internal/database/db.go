package database

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(){
	db_url := os.Getenv("DATABASE_URL")
	var err error
	DB, err = gorm.Open(postgres.Open(db_url), &gorm.Config{})

	if err != nil {
		log.Fatal("Failed to connect to Neon")
	}
}
