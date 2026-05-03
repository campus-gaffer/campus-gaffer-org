package database

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func LoadDBUri() string {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Failed to load .env file")
	}
	return os.Getenv("DATABASE_DEV_URL")
}

func Connect(db_uri string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(db_uri), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to Neon")
	}
	log.Println("Connected to Neon")
	//err = db.AutoMigrate(
	//	&models.Game{},
	//	&models.Player{},
	//	&models.PlayerPerformance{},
	//	&models.Team{},
	//)
	//if err != nil {
	//	log.Fatal("Failed to automigrate")
	//}
	//log.Println("Successfully ran automigrate!")
	DB = db
	return DB
}
