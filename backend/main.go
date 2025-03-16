package main

import (
	"log"
	"net/http"
	"os"

	"arjunmal1311/only_fans_on_chain/backend/db"
	"arjunmal1311/only_fans_on_chain/backend/routes"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found")
	}

	db.InitDB()
	defer db.CloseDB()

	router := mux.NewRouter()

	routes.SetupUserRoutes(router)
	routes.SetupImageRoutes(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatal(err)
	}
}
