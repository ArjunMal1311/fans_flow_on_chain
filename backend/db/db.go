package db

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	Client *mongo.Client
	DB     *mongo.Database
)

func InitDB() {
	mongoURI := os.Getenv("DATABASE_URL")
	if mongoURI == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	var err error
	Client, err = mongo.Connect(context.Background(), options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	err = Client.Ping(context.Background(), nil)
	if err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}

	DB = Client.Database("ofoc")

	createIndexes()

	log.Println("Successfully connected to MongoDB")
}

func createIndexes() {
	usersCollection := GetCollection("users")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := usersCollection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    map[string]interface{}{"username": 1},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    map[string]interface{}{"email": 1},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    map[string]interface{}{"wallet_address": 1},
			Options: options.Index().SetUnique(true),
		},
	})

	if err != nil {
		log.Printf("Warning: Failed to create indexes: %v", err)
	}

	modelsCollection := GetCollection("models")
	_, err = modelsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    map[string]interface{}{"model_id": 1},
		Options: options.Index().SetUnique(true),
	})

	if err != nil {
		log.Printf("Warning: Failed to create model index: %v", err)
	}
}

func GetCollection(collectionName string) *mongo.Collection {
	return DB.Collection(collectionName)
}

func CloseDB() {
	if Client != nil {
		if err := Client.Disconnect(context.Background()); err != nil {
			log.Printf("Error closing MongoDB connection: %v", err)
		}
	}
}
