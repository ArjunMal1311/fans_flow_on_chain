package routes

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"arjunmal1311/only_fans_on_chain/backend/db"
	"arjunmal1311/only_fans_on_chain/backend/models"
	"arjunmal1311/only_fans_on_chain/backend/types"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func SetupUserRoutes(router *mux.Router) {
	router.HandleFunc("/register", RegisterHandler).Methods("POST")
	router.HandleFunc("/register-model", RegisterModelHandler).Methods("POST")
	router.HandleFunc("/user-info", GetUserInfoHandler).Methods("GET")
	router.HandleFunc("/user-info-moonbeam", GetUserInfoMoonbeamHandler).Methods("GET")
	router.HandleFunc("/user-info-metis", GetUserInfoMetisHandler).Methods("GET")
	router.HandleFunc("/user-model-info", GetUserModelInfoHandler).Methods("GET")
	router.HandleFunc("/purchase-subscription", PurchaseSubscriptionHandler).Methods("POST")
	router.HandleFunc("/list-subscription", ListSubscriptionHandler).Methods("PATCH")
	router.HandleFunc("/update-subscription", UpdateSubscriptionHandler).Methods("PATCH")
	router.HandleFunc("/listed-subscriptions", GetListedSubscriptionsHandler).Methods("GET")

	// ZkEVM routes
	router.HandleFunc("/purchase-subscription-zkevm", PurchaseSubscriptionZkEVMHandler).Methods("POST")
	router.HandleFunc("/list-subscription-zkevm", ListSubscriptionZkEVMHandler).Methods("PATCH")
	router.HandleFunc("/update-subscription-zkevm", UpdateSubscriptionZkEVMHandler).Methods("PATCH")
	router.HandleFunc("/listed-subscriptions-zkevm", GetListedSubscriptionsZkEVMHandler).Methods("GET")

	// Moonbeam routes
	router.HandleFunc("/purchase-subscription-moonbeam", PurchaseSubscriptionMoonbeamHandler).Methods("POST")
	router.HandleFunc("/list-subscription-moonbeam", ListSubscriptionMoonbeamHandler).Methods("PATCH")
	router.HandleFunc("/update-subscription-moonbeam", UpdateSubscriptionMoonbeamHandler).Methods("PATCH")
	router.HandleFunc("/listed-subscriptions-moonbeam", GetListedSubscriptionsMoonbeamHandler).Methods("GET")

	// Metis routes
	router.HandleFunc("/purchase-subscription-metis", PurchaseSubscriptionMetisHandler).Methods("POST")
	router.HandleFunc("/list-subscription-metis", ListSubscriptionMetisHandler).Methods("PATCH")
	router.HandleFunc("/update-subscription-metis", UpdateSubscriptionMetisHandler).Methods("PATCH")
	router.HandleFunc("/listed-subscriptions-metis", GetListedSubscriptionsMetisHandler).Methods("GET")
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var req types.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Email == "" || req.WalletAddress == "" {
		sendError(w, "Username, email, and wallet address are required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection("users")

	filter := bson.M{
		"$or": []bson.M{
			{"email": req.Email},
			{"username": req.Username},
			{"wallet_address": req.WalletAddress},
		},
	}

	var existingUser models.User
	err := collection.FindOne(context.Background(), filter).Decode(&existingUser)
	if err == nil {
		sendError(w, "User already exists with the provided email, username, or wallet address", http.StatusConflict)
		return
	}

	newUser := models.User{
		ID:            primitive.NewObjectID(),
		Username:      req.Username,
		Email:         req.Email,
		WalletAddress: req.WalletAddress,
		IpfsUrl:       req.IpfsUrl,
		OpenAiTokenId: req.OpenAiTokenId,
	}

	_, err = collection.InsertOne(context.Background(), newUser)
	if err != nil {
		sendError(w, "Failed to register user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := types.UserResponse{
		Success: true,
		Message: "User registered successfully",
		Data:    newUser,
	}

	sendJSON(w, response, http.StatusCreated)
}

func RegisterModelHandler(w http.ResponseWriter, r *http.Request) {
	var req types.RegisterModelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.ModelId == "" || req.IpfsUrl == "" {
		sendError(w, "Name, model_id, and ipfs_url are required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection("models")

	var existingModel models.Model
	err := collection.FindOne(context.Background(), bson.M{"model_id": req.ModelId}).Decode(&existingModel)
	if err == nil {
		sendError(w, "Model already exists with the provided model_id", http.StatusConflict)
		return
	}

	newModel := models.Model{
		ID:      primitive.NewObjectID(),
		Name:    req.Name,
		ModelID: req.ModelId,
		IpfsUrl: req.IpfsUrl,
	}

	_, err = collection.InsertOne(context.Background(), newModel)
	if err != nil {
		sendError(w, "Failed to register model: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := types.UserResponse{
		Success: true,
		Message: "Model registered successfully",
		Data:    newModel,
	}

	sendJSON(w, response, http.StatusCreated)
}

func GetUserInfoHandler(w http.ResponseWriter, r *http.Request) {
	walletAddress := r.URL.Query().Get("wallet_address")
	if walletAddress == "" {
		sendError(w, "Wallet address is required", http.StatusBadRequest)
		return
	}

	usersCollection := db.GetCollection("users")
	subscriptionsCollection := db.GetCollection("subscriptions")
	modelsCollection := db.GetCollection("models")

	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"wallet_address": walletAddress}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "User not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	cursor, err := subscriptionsCollection.Find(context.Background(), bson.M{"user_id": user.ID})
	if err != nil {
		sendError(w, "Failed to retrieve subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var subscriptions []models.Subscription
	if err = cursor.All(context.Background(), &subscriptions); err != nil {
		sendError(w, "Failed to decode subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var subscriptionDetails []types.SubscriptionDetails
	for _, sub := range subscriptions {
		var model models.Model
		err := modelsCollection.FindOne(context.Background(), bson.M{"_id": sub.ModelID}).Decode(&model)
		if err != nil {
			continue
		}

		subscriptionDetails = append(subscriptionDetails, types.SubscriptionDetails{
			ModelID:   model.ModelID,
			ModelName: model.Name,
			IpfsUrl:   model.IpfsUrl,
			TokenID:   sub.TokenID,
			IsListed:  sub.IsListed,
			Price:     sub.Price,
		})
	}

	result := types.UserInfoResponse{
		User:          user,
		Subscriptions: subscriptionDetails,
	}

	response := types.UserResponse{
		Success: true,
		Message: "User retrieved successfully",
		Data:    result,
	}

	sendJSON(w, response, http.StatusOK)
}

func GetUserInfoMoonbeamHandler(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		sendError(w, "Email is required", http.StatusBadRequest)
		return
	}

	usersCollection := db.GetCollection("users")
	moonbeamSubsCollection := db.GetCollection("subscriptions_moonbeam")
	modelsCollection := db.GetCollection("models")

	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "User not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	cursor, err := moonbeamSubsCollection.Find(context.Background(), bson.M{"user_id": user.ID})
	if err != nil {
		sendError(w, "Failed to retrieve Moonbeam subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var subscriptions []models.SubscriptionMoonbeam
	if err = cursor.All(context.Background(), &subscriptions); err != nil {
		sendError(w, "Failed to decode Moonbeam subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var subscriptionDetails []types.SubscriptionDetails
	for _, sub := range subscriptions {
		var model models.Model
		err := modelsCollection.FindOne(context.Background(), bson.M{"_id": sub.ModelID}).Decode(&model)
		if err != nil {
			continue
		}

		subscriptionDetails = append(subscriptionDetails, types.SubscriptionDetails{
			ModelID:   model.ModelID,
			ModelName: model.Name,
			IpfsUrl:   model.IpfsUrl,
			TokenID:   sub.TokenID,
			IsListed:  sub.IsListed,
			Price:     sub.Price,
		})
	}

	result := types.UserInfoResponse{
		User:          user,
		Subscriptions: subscriptionDetails,
	}

	response := types.UserResponse{
		Success: true,
		Message: "User retrieved successfully",
		Data:    result,
	}

	sendJSON(w, response, http.StatusOK)
}

func GetUserInfoMetisHandler(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		sendError(w, "Email is required", http.StatusBadRequest)
		return
	}

	usersCollection := db.GetCollection("users")
	metisSubsCollection := db.GetCollection("subscriptions_metis")
	modelsCollection := db.GetCollection("models")

	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "User not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	cursor, err := metisSubsCollection.Find(context.Background(), bson.M{"user_id": user.ID})
	if err != nil {
		sendError(w, "Failed to retrieve Metis subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var subscriptions []models.SubscriptionMetis
	if err = cursor.All(context.Background(), &subscriptions); err != nil {
		sendError(w, "Failed to decode Metis subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var subscriptionDetails []types.SubscriptionDetails
	for _, sub := range subscriptions {
		var model models.Model
		err := modelsCollection.FindOne(context.Background(), bson.M{"_id": sub.ModelID}).Decode(&model)
		if err != nil {
			continue
		}

		subscriptionDetails = append(subscriptionDetails, types.SubscriptionDetails{
			ModelID:   model.ModelID,
			ModelName: model.Name,
			IpfsUrl:   model.IpfsUrl,
			TokenID:   sub.TokenID,
			IsListed:  sub.IsListed,
			Price:     sub.Price,
		})
	}

	result := types.UserInfoResponse{
		User:          user,
		Subscriptions: subscriptionDetails,
	}

	response := types.UserResponse{
		Success: true,
		Message: "User retrieved successfully",
		Data:    result,
	}

	sendJSON(w, response, http.StatusOK)
}

func GetUserModelInfoHandler(w http.ResponseWriter, r *http.Request) {
	walletAddress := r.URL.Query().Get("wallet_address")
	tokenId := r.URL.Query().Get("tokenId")

	if walletAddress == "" || tokenId == "" {
		sendError(w, "Wallet address and tokenId are required", http.StatusBadRequest)
		return
	}

	usersCollection := db.GetCollection("users")

	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"openai_token_id": tokenId}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("No user found with openai_token_id: %s", tokenId)
			sendError(w, "No user matches the provided details", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve user details", http.StatusInternalServerError)
		return
	}

	if !strings.EqualFold(user.WalletAddress, walletAddress) {
		log.Printf("Wallet address mismatch - Expected: %s, Got: %s", user.WalletAddress, walletAddress)
		sendError(w, "No user matches the provided details", http.StatusNotFound)
		return
	}

	result := types.UserModelInfoResponse{
		User: user,
	}

	response := types.UserResponse{
		Success: true,
		Message: "Data retrieved successfully",
		Data:    result,
	}

	sendJSON(w, response, http.StatusOK)
}

func PurchaseSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	var req types.PurchaseSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.ModelId == "" || req.TokenId == "" {
		sendError(w, "Email, modelId, and tokenId are required", http.StatusBadRequest)
		return
	}

	usersCollection := db.GetCollection("users")
	modelsCollection := db.GetCollection("models")
	subscriptionsCollection := db.GetCollection("subscriptions")

	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "User not found with provided email", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var model models.Model
	err = modelsCollection.FindOne(context.Background(), bson.M{"model_id": req.ModelId}).Decode(&model)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "Model not found with provided modelId", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve model: "+err.Error(), http.StatusInternalServerError)
		return
	}

	newSubscription := models.Subscription{
		ID:      primitive.NewObjectID(),
		UserID:  user.ID,
		ModelID: model.ID,
		TokenID: req.TokenId,
	}

	_, err = subscriptionsCollection.InsertOne(context.Background(), newSubscription)
	if err != nil {
		sendError(w, "Failed to create subscription: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := types.PurchaseSubscriptionResponse{
		UserId:  user.ID,
		ModelId: model.ID,
		TokenId: req.TokenId,
	}

	response := types.UserResponse{
		Success: true,
		Message: "Subscription purchased successfully",
		Data:    result,
	}

	sendJSON(w, response, http.StatusOK)
}

func ListSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	var req types.ListSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.TokenId == "" || req.ListingId == "" || req.Price == "" {
		sendError(w, "TokenId, listingId, and price are required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection("subscriptions")

	update := bson.M{
		"$set": bson.M{
			"price":      req.Price,
			"listing_id": req.ListingId,
			"is_listed":  true,
		},
	}

	var updatedSubscription models.Subscription
	err := collection.FindOneAndUpdate(
		context.Background(),
		bson.M{"token_id": req.TokenId},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updatedSubscription)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "Subscription not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to update subscription: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := types.UserResponse{
		Success: true,
		Message: "Subscription listed successfully",
		Data:    updatedSubscription,
	}

	sendJSON(w, response, http.StatusOK)
}

func UpdateSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	var req types.UpdateSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.TokenId == "" || req.WalletAddress == "" {
		sendError(w, "TokenId and wallet_address are required", http.StatusBadRequest)
		return
	}

	usersCollection := db.GetCollection("users")
	subscriptionsCollection := db.GetCollection("subscriptions")

	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"wallet_address": req.WalletAddress}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "User not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	update := bson.M{
		"$set": bson.M{
			"user_id":   user.ID,
			"is_listed": false,
		},
	}

	var updatedSubscription models.Subscription
	err = subscriptionsCollection.FindOneAndUpdate(
		context.Background(),
		bson.M{"token_id": req.TokenId},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updatedSubscription)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "Subscription not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to update subscription: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := types.UserResponse{
		Success: true,
		Message: "Subscription updated successfully",
		Data:    updatedSubscription,
	}

	sendJSON(w, response, http.StatusOK)
}

type ListedSubscriptionResponse struct {
	ID        primitive.ObjectID `json:"id"`
	UserID    primitive.ObjectID `json:"user_id"`
	ModelID   primitive.ObjectID `json:"model_id"`
	TokenID   string             `json:"token_id"`
	ListingID string             `json:"listing_id,omitempty"`
	Price     string             `json:"price,omitempty"`
	IsListed  bool               `json:"is_listed"`
	Model     struct {
		ID      primitive.ObjectID `json:"id"`
		ModelID string             `json:"model_id"`
		Name    string             `json:"name"`
		IpfsUrl string             `json:"ipfs_url"`
	} `json:"model"`
}

func GetListedSubscriptionsHandler(w http.ResponseWriter, r *http.Request) {
	subscriptionsCollection := db.GetCollection("subscriptions")
	modelsCollection := db.GetCollection("models")

	cursor, err := subscriptionsCollection.Find(context.Background(), bson.M{"is_listed": true})
	if err != nil {
		sendError(w, "Failed to retrieve subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var subscriptions []models.Subscription
	if err = cursor.All(context.Background(), &subscriptions); err != nil {
		sendError(w, "Failed to decode subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var listedSubscriptions []ListedSubscriptionResponse
	for _, sub := range subscriptions {
		var model models.Model
		err := modelsCollection.FindOne(context.Background(), bson.M{"_id": sub.ModelID}).Decode(&model)
		if err != nil {
			continue
		}

		listedSub := ListedSubscriptionResponse{
			ID:        sub.ID,
			UserID:    sub.UserID,
			ModelID:   sub.ModelID,
			TokenID:   sub.TokenID,
			ListingID: sub.ListingID,
			Price:     sub.Price,
			IsListed:  sub.IsListed,
		}
		listedSub.Model.ID = model.ID
		listedSub.Model.ModelID = model.ModelID
		listedSub.Model.Name = model.Name
		listedSub.Model.IpfsUrl = model.IpfsUrl

		listedSubscriptions = append(listedSubscriptions, listedSub)
	}

	response := types.UserResponse{
		Success: true,
		Message: "Listed subscriptions retrieved successfully",
		Data:    listedSubscriptions,
	}

	sendJSON(w, response, http.StatusOK)
}

func PurchaseSubscriptionZkEVMHandler(w http.ResponseWriter, r *http.Request) {
	var req types.ChainSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.ModelId == "" || req.TokenId == "" {
		sendError(w, "Email, modelId, and tokenId are required", http.StatusBadRequest)
		return
	}

	usersCollection := db.GetCollection("users")
	modelsCollection := db.GetCollection("models")
	subscriptionsCollection := db.GetCollection("subscriptions_zkevm")

	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "User not found with provided email", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var model models.Model
	err = modelsCollection.FindOne(context.Background(), bson.M{"model_id": req.ModelId}).Decode(&model)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "Model not found with provided modelId", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve model: "+err.Error(), http.StatusInternalServerError)
		return
	}

	newSubscription := models.SubscriptionZkEVM{
		ID:      primitive.NewObjectID(),
		UserID:  user.ID,
		ModelID: model.ID,
		TokenID: req.TokenId,
	}

	_, err = subscriptionsCollection.InsertOne(context.Background(), newSubscription)
	if err != nil {
		sendError(w, "Failed to create subscription: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := types.ChainSubscriptionResponse{
		UserId:  user.ID,
		ModelId: model.ID,
		TokenId: req.TokenId,
	}

	response := types.UserResponse{
		Success: true,
		Message: "Subscription purchased successfully",
		Data:    result,
	}

	sendJSON(w, response, http.StatusOK)
}

func ListSubscriptionZkEVMHandler(w http.ResponseWriter, r *http.Request) {
	var req types.ChainListSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.TokenId == "" {
		sendError(w, "TokenId is required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection("subscriptions_zkevm")

	update := bson.M{
		"$set": bson.M{
			"is_listed": true,
		},
	}

	var updatedSubscription models.SubscriptionZkEVM
	err := collection.FindOneAndUpdate(
		context.Background(),
		bson.M{"token_id": req.TokenId},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updatedSubscription)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "Subscription not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to update subscription: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := types.UserResponse{
		Success: true,
		Message: "Subscription listed successfully",
		Data:    updatedSubscription,
	}

	sendJSON(w, response, http.StatusOK)
}

func UpdateSubscriptionZkEVMHandler(w http.ResponseWriter, r *http.Request) {
	var req types.ChainUpdateSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.TokenId == "" || req.Email == "" {
		sendError(w, "TokenId and email are required", http.StatusBadRequest)
		return
	}

	usersCollection := db.GetCollection("users")
	subscriptionsCollection := db.GetCollection("subscriptions_zkevm")

	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "User not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	update := bson.M{
		"$set": bson.M{
			"user_id":   user.ID,
			"is_listed": false,
		},
	}

	var updatedSubscription models.SubscriptionZkEVM
	err = subscriptionsCollection.FindOneAndUpdate(
		context.Background(),
		bson.M{"token_id": req.TokenId},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updatedSubscription)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "Subscription not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to update subscription: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := types.UserResponse{
		Success: true,
		Message: "Subscription updated successfully",
		Data:    updatedSubscription,
	}

	sendJSON(w, response, http.StatusOK)
}

func GetListedSubscriptionsZkEVMHandler(w http.ResponseWriter, r *http.Request) {
	subscriptionsCollection := db.GetCollection("subscriptions_zkevm")
	modelsCollection := db.GetCollection("models")

	cursor, err := subscriptionsCollection.Find(context.Background(), bson.M{"is_listed": true})
	if err != nil {
		sendError(w, "Failed to retrieve subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var subscriptions []models.SubscriptionZkEVM
	if err = cursor.All(context.Background(), &subscriptions); err != nil {
		sendError(w, "Failed to decode subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var listedSubscriptions []types.ChainListedSubscriptionResponse
	for _, sub := range subscriptions {
		var model models.Model
		err := modelsCollection.FindOne(context.Background(), bson.M{"_id": sub.ModelID}).Decode(&model)
		if err != nil {
			continue
		}

		listedSub := types.ChainListedSubscriptionResponse{
			ID:       sub.ID,
			UserID:   sub.UserID,
			ModelID:  sub.ModelID,
			TokenID:  sub.TokenID,
			IsListed: sub.IsListed,
		}
		listedSub.Model = types.ModelInfo{
			ID:      model.ID,
			ModelID: model.ModelID,
			Name:    model.Name,
			IpfsUrl: model.IpfsUrl,
		}

		listedSubscriptions = append(listedSubscriptions, listedSub)
	}

	response := types.UserResponse{
		Success: true,
		Message: "Listed subscriptions retrieved successfully",
		Data:    listedSubscriptions,
	}

	sendJSON(w, response, http.StatusOK)
}

func PurchaseSubscriptionMoonbeamHandler(w http.ResponseWriter, r *http.Request) {
	var req types.ChainSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.ModelId == "" || req.TokenId == "" {
		sendError(w, "Email, modelId, and tokenId are required", http.StatusBadRequest)
		return
	}

	usersCollection := db.GetCollection("users")
	modelsCollection := db.GetCollection("models")
	subscriptionsCollection := db.GetCollection("subscriptions_moonbeam")

	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "User not found with provided email", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var model models.Model
	err = modelsCollection.FindOne(context.Background(), bson.M{"model_id": req.ModelId}).Decode(&model)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "Model not found with provided modelId", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve model: "+err.Error(), http.StatusInternalServerError)
		return
	}

	newSubscription := models.SubscriptionMoonbeam{
		ID:      primitive.NewObjectID(),
		UserID:  user.ID,
		ModelID: model.ID,
		TokenID: req.TokenId,
	}

	_, err = subscriptionsCollection.InsertOne(context.Background(), newSubscription)
	if err != nil {
		sendError(w, "Failed to create subscription: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := types.ChainSubscriptionResponse{
		UserId:  user.ID,
		ModelId: model.ID,
		TokenId: req.TokenId,
	}

	response := types.UserResponse{
		Success: true,
		Message: "Subscription purchased successfully",
		Data:    result,
	}

	sendJSON(w, response, http.StatusOK)
}

func ListSubscriptionMoonbeamHandler(w http.ResponseWriter, r *http.Request) {
	var req types.ChainListSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.TokenId == "" || req.Price == "" {
		sendError(w, "TokenId and price are required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection("subscriptions_moonbeam")

	update := bson.M{
		"$set": bson.M{
			"price":     req.Price,
			"is_listed": true,
		},
	}

	var updatedSubscription models.SubscriptionMoonbeam
	err := collection.FindOneAndUpdate(
		context.Background(),
		bson.M{"token_id": req.TokenId},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updatedSubscription)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "Subscription not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to update subscription: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := types.UserResponse{
		Success: true,
		Message: "Subscription listed successfully",
		Data:    updatedSubscription,
	}

	sendJSON(w, response, http.StatusOK)
}

func UpdateSubscriptionMoonbeamHandler(w http.ResponseWriter, r *http.Request) {
	var req types.ChainUpdateSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.TokenId == "" || req.Email == "" {
		sendError(w, "TokenId and email are required", http.StatusBadRequest)
		return
	}

	usersCollection := db.GetCollection("users")
	subscriptionsCollection := db.GetCollection("subscriptions_moonbeam")

	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "User not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	update := bson.M{
		"$set": bson.M{
			"user_id":   user.ID,
			"is_listed": false,
		},
	}

	var updatedSubscription models.SubscriptionMoonbeam
	err = subscriptionsCollection.FindOneAndUpdate(
		context.Background(),
		bson.M{"token_id": req.TokenId},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updatedSubscription)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "Subscription not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to update subscription: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := types.UserResponse{
		Success: true,
		Message: "Subscription updated successfully",
		Data:    updatedSubscription,
	}

	sendJSON(w, response, http.StatusOK)
}

func GetListedSubscriptionsMoonbeamHandler(w http.ResponseWriter, r *http.Request) {
	subscriptionsCollection := db.GetCollection("subscriptions_moonbeam")
	modelsCollection := db.GetCollection("models")

	cursor, err := subscriptionsCollection.Find(context.Background(), bson.M{"is_listed": true})
	if err != nil {
		sendError(w, "Failed to retrieve subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var subscriptions []models.SubscriptionMoonbeam
	if err = cursor.All(context.Background(), &subscriptions); err != nil {
		sendError(w, "Failed to decode subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var listedSubscriptions []types.ChainListedSubscriptionResponse
	for _, sub := range subscriptions {
		var model models.Model
		err := modelsCollection.FindOne(context.Background(), bson.M{"_id": sub.ModelID}).Decode(&model)
		if err != nil {
			continue
		}

		listedSub := types.ChainListedSubscriptionResponse{
			ID:       sub.ID,
			UserID:   sub.UserID,
			ModelID:  sub.ModelID,
			TokenID:  sub.TokenID,
			Price:    sub.Price,
			IsListed: sub.IsListed,
		}
		listedSub.Model = types.ModelInfo{
			ID:      model.ID,
			ModelID: model.ModelID,
			Name:    model.Name,
			IpfsUrl: model.IpfsUrl,
		}

		listedSubscriptions = append(listedSubscriptions, listedSub)
	}

	response := types.UserResponse{
		Success: true,
		Message: "Listed subscriptions retrieved successfully",
		Data:    listedSubscriptions,
	}

	sendJSON(w, response, http.StatusOK)
}

func PurchaseSubscriptionMetisHandler(w http.ResponseWriter, r *http.Request) {
	var req types.ChainSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.ModelId == "" || req.TokenId == "" {
		sendError(w, "Email, modelId, and tokenId are required", http.StatusBadRequest)
		return
	}

	usersCollection := db.GetCollection("users")
	modelsCollection := db.GetCollection("models")
	subscriptionsCollection := db.GetCollection("subscriptions_metis")

	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "User not found with provided email", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var model models.Model
	err = modelsCollection.FindOne(context.Background(), bson.M{"model_id": req.ModelId}).Decode(&model)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "Model not found with provided modelId", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve model: "+err.Error(), http.StatusInternalServerError)
		return
	}

	newSubscription := models.SubscriptionMetis{
		ID:      primitive.NewObjectID(),
		UserID:  user.ID,
		ModelID: model.ID,
		TokenID: req.TokenId,
	}

	_, err = subscriptionsCollection.InsertOne(context.Background(), newSubscription)
	if err != nil {
		sendError(w, "Failed to create subscription: "+err.Error(), http.StatusInternalServerError)
		return
	}

	result := types.ChainSubscriptionResponse{
		UserId:  user.ID,
		ModelId: model.ID,
		TokenId: req.TokenId,
	}

	response := types.UserResponse{
		Success: true,
		Message: "Subscription purchased successfully",
		Data:    result,
	}

	sendJSON(w, response, http.StatusOK)
}

func ListSubscriptionMetisHandler(w http.ResponseWriter, r *http.Request) {
	var req types.ChainListSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.TokenId == "" || req.Price == "" {
		sendError(w, "TokenId and price are required", http.StatusBadRequest)
		return
	}

	collection := db.GetCollection("subscriptions_metis")

	update := bson.M{
		"$set": bson.M{
			"price":     req.Price,
			"is_listed": true,
		},
	}

	var updatedSubscription models.SubscriptionMetis
	err := collection.FindOneAndUpdate(
		context.Background(),
		bson.M{"token_id": req.TokenId},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updatedSubscription)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "Subscription not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to update subscription: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := types.UserResponse{
		Success: true,
		Message: "Subscription listed successfully",
		Data:    updatedSubscription,
	}

	sendJSON(w, response, http.StatusOK)
}

func UpdateSubscriptionMetisHandler(w http.ResponseWriter, r *http.Request) {
	var req types.ChainUpdateSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.TokenId == "" || req.Email == "" {
		sendError(w, "TokenId and email are required", http.StatusBadRequest)
		return
	}

	usersCollection := db.GetCollection("users")
	subscriptionsCollection := db.GetCollection("subscriptions_metis")

	var user models.User
	err := usersCollection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "User not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to retrieve user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	update := bson.M{
		"$set": bson.M{
			"user_id":   user.ID,
			"is_listed": false,
		},
	}

	var updatedSubscription models.SubscriptionMetis
	err = subscriptionsCollection.FindOneAndUpdate(
		context.Background(),
		bson.M{"token_id": req.TokenId},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updatedSubscription)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			sendError(w, "Subscription not found", http.StatusNotFound)
			return
		}
		sendError(w, "Failed to update subscription: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := types.UserResponse{
		Success: true,
		Message: "Subscription updated successfully",
		Data:    updatedSubscription,
	}

	sendJSON(w, response, http.StatusOK)
}

func GetListedSubscriptionsMetisHandler(w http.ResponseWriter, r *http.Request) {
	subscriptionsCollection := db.GetCollection("subscriptions_metis")
	modelsCollection := db.GetCollection("models")

	cursor, err := subscriptionsCollection.Find(context.Background(), bson.M{"is_listed": true})
	if err != nil {
		sendError(w, "Failed to retrieve subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var subscriptions []models.SubscriptionMetis
	if err = cursor.All(context.Background(), &subscriptions); err != nil {
		sendError(w, "Failed to decode subscriptions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var listedSubscriptions []types.ChainListedSubscriptionResponse
	for _, sub := range subscriptions {
		var model models.Model
		err := modelsCollection.FindOne(context.Background(), bson.M{"_id": sub.ModelID}).Decode(&model)
		if err != nil {
			continue
		}

		listedSub := types.ChainListedSubscriptionResponse{
			ID:       sub.ID,
			UserID:   sub.UserID,
			ModelID:  sub.ModelID,
			TokenID:  sub.TokenID,
			Price:    sub.Price,
			IsListed: sub.IsListed,
		}
		listedSub.Model = types.ModelInfo{
			ID:      model.ID,
			ModelID: model.ModelID,
			Name:    model.Name,
			IpfsUrl: model.IpfsUrl,
		}

		listedSubscriptions = append(listedSubscriptions, listedSub)
	}

	response := types.UserResponse{
		Success: true,
		Message: "Listed subscriptions retrieved successfully",
		Data:    listedSubscriptions,
	}

	sendJSON(w, response, http.StatusOK)
}

func sendJSON(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func sendError(w http.ResponseWriter, message string, status int) {
	response := types.UserResponse{
		Success: false,
		Error:   message,
	}
	sendJSON(w, response, status)
}
