package main

import (
	"github.com/joho/godotenv"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/handlers"
	"github.com/gin-gonic/gin"
)

func main(){
	godotenv.Load()
	database.Connect()

	database.DB.AutoMigrate(&models.User{})

	result := gin.Default()
	
	result.Use(func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*") // Allows React to talk to Go
        c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        c.Next()
    })


	result.POST("/users", handlers.CreateUser)
	result.GET("/users", handlers.GetUser)
	result.Run(":8081")
}
