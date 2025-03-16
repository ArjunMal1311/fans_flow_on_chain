package routes

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"arjunmal1311/only_fans_on_chain/backend/types"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gorilla/mux"
)

const (
	imagePigEndpoint = "https://api.imagepig.com/xl"
	pinataEndpoint   = "https://api.pinata.cloud/pinning/pinFileToIPFS"
	defaultPrompt    = "happy sunbathing pig, resting"
)

var cld *cloudinary.Cloudinary

func init() {
	cloudinaryURL := os.Getenv("CLOUDINARY_URL")
	if cloudinaryURL == "" {
		log.Printf("Warning: CLOUDINARY_URL environment variable is not set")
		return
	}

	var err error
	cld, err = cloudinary.NewFromURL(cloudinaryURL)
	if err != nil {
		log.Printf("Failed to initialize Cloudinary: %v", err)
		return
	}
	log.Printf("Cloudinary initialized successfully")
}

func SetupImageRoutes(router *mux.Router) {
	router.HandleFunc("/generate-avatar-imagepig", GenerateAvatarHandler).Methods("POST")
	router.HandleFunc("/create-nft-pin-metadata", CreateNFTPinMetadataHandler).Methods("POST")
	router.HandleFunc("/server-storage-clean", ServerStorageCleanHandler).Methods("POST")
}

type imagePigRequest struct {
	Prompt string `json:"prompt"`
}

type imagePigResponse struct {
	ImageData string `json:"image_data"`
}

func GenerateAvatarHandler(w http.ResponseWriter, r *http.Request) {
	var req types.GenerateAvatarRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		sendError(w, "Missing required 'name' in the body", http.StatusBadRequest)
		return
	}

	prompt := defaultPrompt
	if req.Prompt != "" {
		prompt = req.Prompt
	}

	imageData, err := generateImage(prompt)
	if err != nil {
		sendError(w, fmt.Sprintf("Error generating image: %v", err), http.StatusInternalServerError)
		return
	}

	filePath, err := saveImage(imageData, req.Name)
	if err != nil {
		sendError(w, fmt.Sprintf("Error saving image: %v", err), http.StatusInternalServerError)
		return
	}

	response := types.GenerateAvatarResponse{
		Success:  true,
		Message:  "Image generated and saved successfully",
		FilePath: filePath,
	}

	sendJSON(w, response, http.StatusOK)
}

func CreateNFTPinMetadataHandler(w http.ResponseWriter, r *http.Request) {
	if cld == nil {
		sendError(w, "Cloudinary is not properly initialized. Please check your CLOUDINARY_URL environment variable.", http.StatusInternalServerError)
		return
	}

	var req types.CreateNFTMetadataRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Description == "" {
		sendError(w, "Missing required fields: name or description", http.StatusBadRequest)
		return
	}

	filePath := filepath.Join(".", fmt.Sprintf("%s.jpeg", req.Name))
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		sendError(w, "Image file not found. Ensure the file path is correct", http.StatusNotFound)
		return
	}

	ctx := context.Background()
	uploadResult, err := cld.Upload.Upload(ctx, filePath, uploader.UploadParams{
		PublicID: req.Name,
		Folder:   "nft_images",
	})
	if err != nil {
		sendError(w, fmt.Sprintf("Error uploading to Cloudinary: %v", err), http.StatusInternalServerError)
		return
	}

	attributes := []types.NFTAttribute{
		{TraitType: "Category", Value: "Art"},
		{TraitType: "Style", Value: "Generated"},
		{TraitType: "Model", Value: "ImagePig"},
	}

	metadata := types.NFTMetadata{
		Name:        req.Name,
		Description: req.Description,
		Image:       uploadResult.SecureURL,
		Attributes:  attributes,
	}

	metadataJSON, err := json.MarshalIndent(metadata, "", "  ")
	if err != nil {
		sendError(w, fmt.Sprintf("Error creating metadata JSON: %v", err), http.StatusInternalServerError)
		return
	}

	response := types.CreateNFTMetadataResponse{
		Success:      true,
		Message:      "Image successfully uploaded to Cloudinary",
		ImageURL:     uploadResult.SecureURL,
		MetadataJSON: string(metadataJSON),
	}

	sendJSON(w, response, http.StatusOK)
}

func ServerStorageCleanHandler(w http.ResponseWriter, r *http.Request) {
	var req types.ServerStorageCleanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		sendError(w, "Missing required fields: name", http.StatusBadRequest)
		return
	}

	filePath := filepath.Join(".", fmt.Sprintf("%s.jpeg", req.Name))
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		sendError(w, "Image file not found. Ensure the file path is correct", http.StatusNotFound)
		return
	}

	if err := os.Remove(filePath); err != nil {
		sendError(w, fmt.Sprintf("Failed to delete file: %v", err), http.StatusInternalServerError)
		return
	}

	response := types.ServerStorageCleanResponse{
		Success: true,
		Message: "Image Successfully removed",
	}

	sendJSON(w, response, http.StatusOK)
}

func generateImage(prompt string) (string, error) {
	apiKey := os.Getenv("IMAGE_PIG")
	if apiKey == "" {
		return "", fmt.Errorf("IMAGE_PIG environment variable not set")
	}

	reqBody := imagePigRequest{
		Prompt: prompt,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("error marshaling request: %v", err)
	}

	req, err := http.NewRequest("POST", imagePigEndpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("error creating request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Api-Key", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("ImagePig API error: %s", string(body))
	}

	var imagePigResp imagePigResponse
	if err := json.NewDecoder(resp.Body).Decode(&imagePigResp); err != nil {
		return "", fmt.Errorf("error decoding response: %v", err)
	}

	return imagePigResp.ImageData, nil
}

func saveImage(imageData string, fileName string) (string, error) {
	decoded, err := base64.StdEncoding.DecodeString(imageData)
	if err != nil {
		return "", fmt.Errorf("error decoding base64 image: %v", err)
	}

	filePath := filepath.Join(".", fmt.Sprintf("%s.jpeg", fileName))
	if err := os.WriteFile(filePath, decoded, 0644); err != nil {
		return "", fmt.Errorf("error saving image: %v", err)
	}

	return filePath, nil
}

func pinFileToIPFS(filePath, fileName string) (*types.PinataResponse, error) {
	jwt := os.Getenv("JWT")
	if jwt == "" {
		return nil, fmt.Errorf("JWT environment variable not set")
	}

	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("error opening file: %v", err)
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return nil, fmt.Errorf("error creating form file: %v", err)
	}
	if _, err := io.Copy(part, file); err != nil {
		return nil, fmt.Errorf("error copying file: %v", err)
	}

	metadata := map[string]string{"name": fileName}
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return nil, fmt.Errorf("error marshaling metadata: %v", err)
	}
	if err := writer.WriteField("pinataMetadata", string(metadataJSON)); err != nil {
		return nil, fmt.Errorf("error writing metadata field: %v", err)
	}

	options := map[string]interface{}{"cidVersion": 0}
	optionsJSON, err := json.Marshal(options)
	if err != nil {
		return nil, fmt.Errorf("error marshaling options: %v", err)
	}
	if err := writer.WriteField("pinataOptions", string(optionsJSON)); err != nil {
		return nil, fmt.Errorf("error writing options field: %v", err)
	}

	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("error closing writer: %v", err)
	}

	req, err := http.NewRequest("POST", pinataEndpoint, body)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", jwt))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("pinata API error: %s", string(body))
	}

	var pinataResp types.PinataResponse
	if err := json.NewDecoder(resp.Body).Decode(&pinataResp); err != nil {
		return nil, fmt.Errorf("error decoding response: %v", err)
	}

	return &pinataResp, nil
}
