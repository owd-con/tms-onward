package usecase

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type UploadUsecase struct {
	s3Client *s3.Client
	bucket   string
	region   string
	ctx      context.Context
}

// PresignedURLResponse contains the presigned URL and final file URL
type PresignedURLResponse struct {
	UploadURL string `json:"upload_url"` // Presigned URL for PUT request
	FileURL   string `json:"file_url"`   // Final URL after upload
}

func (u *UploadUsecase) WithContext(ctx context.Context) *UploadUsecase {
	return &UploadUsecase{
		s3Client: u.s3Client,
		bucket:   u.bucket,
		region:   u.region,
		ctx:      ctx,
	}
}

// GeneratePresignedPutURL generates a presigned URL for PUT request (upload)
func (u *UploadUsecase) GeneratePresignedPutURL(filename, contentType string) (*PresignedURLResponse, error) {
	ctx := context.Background()

	// Generate file path: files/pod/{year}/{month}/{uuid}.jpg
	now := time.Now()
	filePath := fmt.Sprintf("files/pod/%d/%02d/%s.jpg", now.Year(), now.Month(), uuid.New().String())

	// Create presign client
	presignClient := s3.NewPresignClient(u.s3Client)

	// Create presigned URL for PUT object
	presignedResult, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(u.bucket),
		Key:         aws.String(filePath),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(10*time.Minute)) // 10 minutes expiration
	if err != nil {
		return nil, fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	// Build final file URL
	fileURL := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", u.bucket, u.region, filePath)

	return &PresignedURLResponse{
		UploadURL: presignedResult.URL,
		FileURL:   fileURL,
	}, nil
}

// GeneratePresignedGetURL generates a presigned URL for GET request (download/view)
func (u *UploadUsecase) GeneratePresignedGetURL(filePath string) (*PresignedURLResponse, error) {
	ctx := context.Background()

	// Create presign client
	presignClient := s3.NewPresignClient(u.s3Client)

	// Create presigned URL for GET object
	presignedResult, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(u.bucket),
		Key:    aws.String(filePath),
	}, s3.WithPresignExpires(10*time.Minute)) // 10 minutes expiration
	if err != nil {
		return nil, fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return &PresignedURLResponse{
		UploadURL: presignedResult.URL,
		FileURL:   presignedResult.URL,
	}, nil
}

// NewUploadUsecase creates a new UploadUsecase with S3 client
func NewUploadUsecase() (*UploadUsecase, error) {
	// Load AWS configuration from environment
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(getEnv("AWS_REGION", "ap-southeast-3")),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	// Create S3 client
	s3Client := s3.NewFromConfig(cfg)

	return &UploadUsecase{
		s3Client: s3Client,
		bucket:   getEnv("S3_BUCKET_NAME", "onward.dev"),
		region:   getEnv("AWS_REGION", "ap-southeast-3"),
		ctx:      context.Background(),
	}, nil
}

// getEnv gets environment variable with default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
