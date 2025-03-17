package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Username      string             `bson:"username" json:"username"`
	Email         string             `bson:"email" json:"email"`
	WalletAddress string             `bson:"wallet_address" json:"wallet_address"`
	IpfsUrl       string             `bson:"ipfs_url,omitempty" json:"ipfs_url,omitempty"`
	OpenAiTokenId string             `bson:"openai_token_id,omitempty" json:"openai_token_id,omitempty"`
}

type Model struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name          string             `bson:"name" json:"name"`
	ModelID       string             `bson:"model_id" json:"model_id"`
	Email         string             `bson:"email" json:"email"`
	WalletAddress string             `bson:"wallet_address" json:"wallet_address"`
	IpfsUrl       string             `bson:"ipfs_url" json:"ipfs_url"`
	OpenAiTokenId string             `bson:"openai_token_id,omitempty" json:"openai_token_id,omitempty"`
	Slug          string             `bson:"slug" json:"slug"`
	Location      string             `bson:"location" json:"location"`
	AboutMe       string             `bson:"about_me" json:"aboutMe"`
	Value         float64            `bson:"value" json:"value"`
	Views         int64              `bson:"views" json:"views"`
	Tease         int64              `bson:"tease" json:"tease"`
	Posts         int64              `bson:"posts" json:"posts"`
	Image         struct {
		Src string `bson:"src" json:"src"`
	} `bson:"image" json:"image"`
	Icon struct {
		Src string `bson:"src" json:"src"`
	} `bson:"icon" json:"icon"`
}

type Subscription struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
	ModelID   primitive.ObjectID `bson:"model_id" json:"model_id"`
	TokenID   string             `bson:"token_id" json:"token_id"`
	ListingID string             `bson:"listing_id,omitempty" json:"listing_id,omitempty"`
	Price     string             `bson:"price,omitempty" json:"price,omitempty"`
	IsListed  bool               `bson:"is_listed" json:"is_listed"`
}

type SubscriptionMetis struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID   primitive.ObjectID `bson:"user_id" json:"user_id"`
	ModelID  primitive.ObjectID `bson:"model_id" json:"model_id"`
	TokenID  string             `bson:"token_id" json:"token_id"`
	Price    string             `bson:"price,omitempty" json:"price,omitempty"`
	IsListed bool               `bson:"is_listed" json:"is_listed"`
}

type SubscriptionMoonbeam struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID   primitive.ObjectID `bson:"user_id" json:"user_id"`
	ModelID  primitive.ObjectID `bson:"model_id" json:"model_id"`
	TokenID  string             `bson:"token_id" json:"token_id"`
	Price    string             `bson:"price,omitempty" json:"price,omitempty"`
	IsListed bool               `bson:"is_listed" json:"is_listed"`
}

type SubscriptionZkEVM struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID   primitive.ObjectID `bson:"user_id" json:"user_id"`
	ModelID  primitive.ObjectID `bson:"model_id" json:"model_id"`
	TokenID  string             `bson:"token_id" json:"token_id"`
	IsListed bool               `bson:"is_listed" json:"is_listed"`
}
