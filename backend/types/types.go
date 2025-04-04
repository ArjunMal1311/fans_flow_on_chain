package types

import (
	"arjunmal1311/fans_flow_on_chain/backend/models"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type RegisterRequest struct {
	Username      string `json:"username"`
	Email         string `json:"email"`
	WalletAddress string `json:"wallet_address"`
	IpfsUrl       string `json:"ipfs_url,omitempty"`
	OpenAiTokenId string `json:"openai_token_id,omitempty"`
}

type UserInfoResponse struct {
	User          models.User           `json:"user"`
	Subscriptions []SubscriptionDetails `json:"subscriptions"`
}

type SubscriptionDetails struct {
	ModelID   string `json:"modelId"`
	ModelName string `json:"modelName"`
	IpfsUrl   string `json:"ipfsUrl"`
	TokenID   string `json:"tokenId"`
	IsListed  bool   `json:"isListed"`
	Price     string `json:"price,omitempty"`
}

type UserModelInfoResponse struct {
	User  models.User  `json:"user"`
	Model models.Model `json:"model"`
}

type PurchaseSubscriptionRequest struct {
	Email   string `json:"email"`
	ModelId string `json:"modelId"`
	TokenId string `json:"tokenId"`
}

type PurchaseSubscriptionResponse struct {
	UserId  primitive.ObjectID `json:"userId"`
	ModelId primitive.ObjectID `json:"modelId"`
	TokenId string             `json:"tokenId"`
}

type RegisterModelRequest struct {
	Name          string  `json:"name"`
	ModelId       string  `json:"model_id"`
	Email         string  `json:"email"`
	WalletAddress string  `json:"wallet_address"`
	IpfsUrl       string  `json:"ipfs_url"`
	OpenAiTokenId string  `json:"openai_token_id,omitempty"`
	Slug          string  `json:"slug"`
	Location      string  `json:"location"`
	AboutMe       string  `json:"aboutMe"`
	Value         float64 `json:"value"`
	Views         int64   `json:"views"`
	Tease         int64   `json:"tease"`
	Posts         int64   `json:"posts"`
	Image         struct {
		Src string `json:"src"`
	} `json:"image"`
	Icon struct {
		Src string `json:"src"`
	} `json:"icon"`
}

type ListSubscriptionRequest struct {
	TokenId   string `json:"tokenId"`
	ListingId string `json:"listingId"`
	Price     string `json:"price"`
}

type UpdateSubscriptionRequest struct {
	TokenId       string `json:"TokenId"`
	WalletAddress string `json:"WalletAddress"`
	IsListed      bool   `json:"IsListed"`
	Price         string `json:"Price"`
}

type ListedSubscriptionResponse struct {
	ID        primitive.ObjectID `json:"id"`
	UserID    primitive.ObjectID `json:"user_id"`
	ModelID   primitive.ObjectID `json:"model_id"`
	TokenID   string             `json:"token_id"`
	ListingID string             `json:"listing_id,omitempty"`
	Price     string             `json:"price,omitempty"`
	IsListed  bool               `json:"is_listed"`
	Model     ModelInfo          `json:"model"`
}

type ModelData struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name     string             `bson:"name" json:"name"`
	Slug     string             `bson:"slug" json:"slug"`
	Location string             `bson:"location" json:"location"`
	AboutMe  string             `bson:"about_me" json:"aboutMe"`
	Value    float64            `bson:"value" json:"value"`
	Views    int64              `bson:"views" json:"views"`
	Tease    int64              `bson:"tease" json:"tease"`
	Posts    int64              `bson:"posts" json:"posts"`
	Image    struct {
		Src string `bson:"src" json:"src"`
	} `bson:"image" json:"image"`
	Icon struct {
		Src string `bson:"src" json:"src"`
	} `bson:"icon" json:"icon"`
}

type ModelInfo struct {
	ID       primitive.ObjectID `json:"id"`
	ModelID  string             `json:"model_id"`
	Name     string             `json:"name"`
	Slug     string             `json:"slug"`
	Location string             `json:"location"`
	AboutMe  string             `json:"aboutMe"`
	Value    float64            `json:"value"`
	Views    int64              `json:"views"`
	Tease    int64              `json:"tease"`
	Posts    int64              `json:"posts"`
	Image    struct {
		Src string `json:"src"`
	} `json:"image"`
	Icon struct {
		Src string `json:"src"`
	} `json:"icon"`
	IpfsUrl string `json:"ipfs_url"`
}

type ChainSubscriptionRequest struct {
	Email   string `json:"email"`
	ModelId string `json:"modelId"`
	TokenId string `json:"tokenId"`
}

type ChainListSubscriptionRequest struct {
	TokenId string `json:"tokenId"`
	Price   string `json:"price,omitempty"`
}

type ChainUpdateSubscriptionRequest struct {
	TokenId string `json:"tokenId"`
	Email   string `json:"email"`
}

type ChainSubscriptionResponse struct {
	UserId  primitive.ObjectID `json:"userId"`
	ModelId primitive.ObjectID `json:"modelId"`
	TokenId string             `json:"tokenId"`
}

type ChainListedSubscriptionResponse struct {
	ID       primitive.ObjectID `json:"id"`
	UserID   primitive.ObjectID `json:"user_id"`
	ModelID  primitive.ObjectID `json:"model_id"`
	TokenID  string             `json:"token_id"`
	Price    string             `json:"price,omitempty"`
	IsListed bool               `json:"is_listed"`
	Model    ModelInfo          `json:"model"`
}

type GenerateAvatarRequest struct {
	Name   string `json:"name"`
	Prompt string `json:"prompt"`
}

type GenerateAvatarResponse struct {
	Success  bool   `json:"success"`
	Message  string `json:"message,omitempty"`
	FilePath string `json:"filePath,omitempty"`
	Error    string `json:"error,omitempty"`
}

type CreateNFTMetadataRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type NFTAttribute struct {
	TraitType string `json:"trait_type"`
	Value     string `json:"value"`
}

type NFTMetadata struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Image       string         `json:"image"`
	Attributes  []NFTAttribute `json:"attributes"`
}

type PinataResponse struct {
	IpfsHash string `json:"IpfsHash"`
}

type CreateNFTMetadataResponse struct {
	Success      bool   `json:"success"`
	Message      string `json:"message"`
	ImageURL     string `json:"imageUrl"`
	IpfsURL      string `json:"ipfsUrl"`
	MetadataJSON string `json:"metadataJson"`
}

type ServerStorageCleanRequest struct {
	Name string `json:"name"`
}

type ServerStorageCleanResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}
