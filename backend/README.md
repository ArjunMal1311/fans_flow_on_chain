# FansFlow on Chain Backend API Documentation

This is the backend API for the FansFlow platform, providing functionality for user management, NFT creation, and subscription handling across multiple blockchain networks (ZkEVM, Moonbeam, and Metis).

## Table of Contents
- [Environment Setup](#environment-setup)
- [Image Generation & NFT Routes](#image-generation--nft-routes)
- [User Management Routes](#user-management-routes)
- [Subscription Management Routes](#subscription-management-routes)

## Environment Setup

Create a `.env` file in the root directory with the following environment variables:

### Database Configuration
```env
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority"
```
- Get this from MongoDB Atlas dashboard
- Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### Pinata Cloud (IPFS Storage)
```env
API_KEY="your_pinata_api_key"
API_SECRET="your_pinata_api_secret"
JWT="your_pinata_jwt_token"
```
1. Sign up at [Pinata Cloud](https://www.pinata.cloud/)
2. Go to API Keys section
3. Create a new API Key with the required permissions
4. Copy the generated keys and JWT token

### Image Generation (ImagePig)
```env
IMAGE_PIG="your_imagepig_api_key"
```
1. Sign up at [ImagePig](https://www.imagepig.com)
2. Navigate to API section
3. Generate an API key for image generation

### Image Storage (Cloudinary)
```env
CLOUDINARY_URL="cloudinary://<api_key>:<api_secret>@<cloud_name>"
```
1. Create account at [Cloudinary](https://cloudinary.com/)
2. Go to Dashboard
3. Find your cloud name, API key, and API secret
4. Format: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`

Example of a complete `.env` file:
```env
# MongoDB Connection
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"

# Pinata Cloud IPFS
API_KEY="1234567890abcdef"
API_SECRET="0987654321fedcba"
JWT="eyJhbGciOiJIUzI1NiIsInR5..."

# ImagePig
IMAGE_PIG="imagepig_api_key_here"

# Cloudinary
CLOUDINARY_URL="cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz12@your-cloud-name"
```

**Important Security Notes:**
1. Never commit your `.env` file to version control
2. Keep your API keys secure and rotate them periodically
3. Use environment-specific keys for development and production
4. Set appropriate CORS and API rate limits

## Image Generation & NFT Routes

### 1. Generate Avatar
```http
POST /generate-avatar-imagepig
Content-Type: application/json

{
    "name": "string",     // Required: Name for the generated image
    "prompt": "string"    // Optional: Custom prompt for image generation
}
```
Response:
```json
{
    "success": true,
    "message": "Image generated and saved successfully",
    "filePath": "string"
}
```

### 2. Create NFT Metadata
```http
POST /create-nft-pin-metadata
Content-Type: application/json

{
    "name": "string",        // Required: Name for the NFT
    "description": "string"  // Required: Description of the NFT
}
```
Response:
```json
{
    "success": true,
    "message": "Image successfully uploaded to Cloudinary",
    "imageUrl": "string",
    "metadata": {
        "name": "string",
        "description": "string",
        "image": "string",
        "attributes": [
            {
                "trait_type": "Category",
                "value": "Art"
            },
            {
                "trait_type": "Style",
                "value": "Generated"
            },
            {
                "trait_type": "Model",
                "value": "ImagePig"
            }
        ]
    }
}
```

### 3. Clean Server Storage
```http
POST /server-storage-clean
Content-Type: application/json

{
    "name": "string"  // Required: Name of the file to delete
}
```
Response:
```json
{
    "success": true,
    "message": "Image Successfully removed"
}
```

## User Management Routes

### 1. Register User
```http
POST /register
Content-Type: application/json

{
    "username": "string",       // Required
    "email": "string",         // Required
    "wallet_address": "string", // Required
    "ipfs_url": "string",      // Optional
    "openai_token_id": "string" // Optional
}
```
Response:
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "id": "string",
        "username": "string",
        "email": "string",
        "wallet_address": "string",
        "ipfs_url": "string",
        "openai_token_id": "string"
    }
}
```

### 2. Register Model
```http
POST /register-model
Content-Type: application/json

{
    "name": "string",          // Required: Display name
    "model_id": "string",      // Required: Unique identifier
    "email": "string",         // Required: Email address
    "wallet_address": "string", // Required: Blockchain wallet address
    "ipfs_url": "string",      // Required: IPFS URL for model's content
    "openai_token_id": "string", // Optional: OpenAI token ID
    // Profile Information
    "slug": "string",          // Optional: URL-friendly name
    "location": "string",      // Optional: Model's location
    "aboutMe": "string",       // Optional: Model's description
    "value": 0.0,             // Optional: Model's value/rate
    "views": 0,               // Optional: View count
    "tease": 0,               // Optional: Tease count
    "posts": 0,               // Optional: Post count
    "image": {                // Optional: Main profile image
        "src": "string"
    },
    "icon": {                 // Optional: Profile icon/avatar
        "src": "string"
    }
}
```
Response:
```json
{
    "success": true,
    "message": "Model registered successfully",
    "data": {
        "id": "string",
        "name": "string",
        "model_id": "string",
        "email": "string",
        "wallet_address": "string",
        "ipfs_url": "string",
        "openai_token_id": "string",
        "slug": "string",
        "location": "string",
        "aboutMe": "string",
        "value": 0.0,
        "views": 0,
        "tease": 0,
        "posts": 0,
        "image": {
            "src": "string"
        },
        "icon": {
            "src": "string"
        }
    }
}
```

### 3. Get User Info
```http
GET /user-info?wallet_address=string
GET /user-info-moonbeam?email=string
GET /user-info-metis?email=string
```
Response:
```json
{
    "success": true,
    "message": "User retrieved successfully",
    "data": {
        "user": {
            "id": "string",
            "username": "string",
            "email": "string",
            "wallet_address": "string",
            "ipfs_url": "string",
            "openai_token_id": "string"
        },
        "subscriptions": [
            {
                "modelId": "string",
                "modelName": "string",
                "ipfsUrl": "string",
                "tokenId": "string",
                "isListed": false,
                "price": "string"
            }
        ]
    }
}
```

### 4. Get User Model Info
```http
GET /user-model-info?wallet_address=string&tokenId=string
```
Response:
```json
{
    "success": true,
    "message": "Data retrieved successfully",
    "data": {
        "user": {
            "id": "string",
            "username": "string",
            "email": "string",
            "wallet_address": "string",
            "ipfs_url": "string",
            "openai_token_id": "string"
        },
        "model": {
            "id": "string",
            "name": "string",
            "model_id": "string",
            "email": "string",
            "wallet_address": "string",
            "ipfs_url": "string",
            "openai_token_id": "string",
            "slug": "string",
            "location": "string",
            "aboutMe": "string",
            "value": 0.0,
            "views": 0,
            "tease": 0,
            "posts": 0,
            "image": {
                "src": "string"
            },
            "icon": {
                "src": "string"
            }
        }
    }
}
```

## Subscription Management Routes

The API supports subscription management across three blockchain networks:
- ZkEVM
- Moonbeam
- Metis

Each network has the following routes (replace {network} with zkevm, moonbeam, or metis):

### 1. Purchase Subscription
```http
POST /purchase-subscription-{network}
Content-Type: application/json

{
    "email": "string",   // Required
    "modelId": "string", // Required
    "tokenId": "string"  // Required
}
```

### 2. List Subscription
```http
PATCH /list-subscription-{network}
Content-Type: application/json

{
    "tokenId": "string", // Required
    "price": "string"    // Required for moonbeam and metis
}
```

### 3. Update Subscription
```http
PATCH /update-subscription-{network}
Content-Type: application/json

{
    "tokenId": "string", // Required
    "email": "string"    // Required
}
```

### 4. Get Listed Subscriptions
```http
GET /listed-subscriptions-{network}
```

## Error Handling

All endpoints return errors in the following format:
```json
{
    "success": false,
    "error": "Error message description"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

## Database Collections

The API uses MongoDB with the following collections:
- users
- models
- subscriptions
- subscriptions_zkevm
- subscriptions_moonbeam
- subscriptions_metis

## Dependencies

- MongoDB for database
- Pinata Cloud for IPFS storage
- Cloudinary for image storage
- ImagePig for AI image generation