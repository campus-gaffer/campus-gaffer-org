package database

import (
	// "campus-gaffer-backend/internal/models"
	"log"
	"os"
	"sync"
	
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	initDB sync.Once
	DB *gorm.DB
)

func LoadDBUri() string {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Failed to load .env file")
	}
	return os.Getenv("DATABASE_DEV_URL")
}

func Connect(db_uri string) *gorm.DB {
	initDB.Do(func() {
		db, err := gorm.Open(postgres.Open(db_uri), &gorm.Config{})
		if err != nil {
			log.Fatal("Failed to connect to Neon")
		}
		log.Println("Connected to Neon")
		DB = db
		if DB == nil {
			log.Fatal("Failed to set DB to db!")
		}
	})
	// db, err := gorm.Open(postgres.Open(db_uri), &gorm.Config{})
	// err = db.AutoMigrate(
	// 	&models.Game{},
	// 	&models.Player{},
	// 	&models.PlayerPerformance{},
	// 	&models.Team{},
	// 	&models.PlayerGamePoint{},
	// 	&models.PlayerPrice{},
	// )
	// if err != nil {
	// 	log.Fatal("Failed to automigrate")
	// }
	// log.Println("Successfully ran automigrate!")
	// DB = db
	return DB
}
