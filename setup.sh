#!/usr/bin/env bash

set -e

PROJECT_NAME="khipusol"

echo "🚀 Creating directory structure for ${PROJECT_NAME}..."

# Create project folders
mkdir -p .github/workflows
mkdir -p internal/config
mkdir -p internal/model
mkdir -p internal/fetcher
mkdir -p internal/storage
mkdir -p internal/processor

echo "📦 Creating go.mod..."
cat << 'EOF' > go.mod
module https://github.com/mistergamarra/khipusol

go 1.26

require go.etcd.io/bbolt v1.3.10

require golang.org/x/sys v0.20.0 // indirect
EOF

echo "⚙️ Creating .goreleaser.yaml..."
cat << 'EOF' > .goreleaser.yaml
version: 2

project_name: khipusol

before:
  hooks:
    - go mod tidy

builds:
  - id: khipusol
    main: ./main.go
    binary: khipusol
    env:
      - CGO_ENABLED=0
    goos:
      - darwin
      - linux
      - windows
    goarch:
      - amd64
      - arm64

archives:
  - id: default
    format: tar.gz
    format_overrides:
      - goos: windows
        format: zip
    name_template: "{{ .ProjectName }}_{{ .Version }}_{{ .Os }}_{{ .Arch }}"

checksum:
  name_template: "checksums.txt"

snapshot:
  version_template: "{{ incpatch .Version }}-next"

changelog:
  sort: asc
  filters:
    exclude:
      - "^docs:"
      - "^test:"
EOF

echo "🐙 Creating GitHub Actions release workflow..."
cat << 'EOF' > .github/workflows/release.yml
name: Release CLI Binaries

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  goreleaser:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.26'

      - name: Run GoReleaser
        uses: goreleaser/goreleaser-action@v6
        with:
          distribution: goreleaser
          version: '~> v2'
          args: release --clean
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
EOF

echo "📄 Creating internal/model/model.go..."
cat << 'EOF' > internal/model/model.go
package model

import "time"

type ExchangeRateRecord struct {
	FecPublica string `json:"fecPublica"`
	ValTipo    string `json:"valTipo"`
	CodTipo    string `json:"codTipo"`
}

type CachedPayload struct {
	FetchedAt time.Time            `json:"fetchedAt"`
	Rates     []ExchangeRateRecord `json:"rates"`
}

type PaymentRecord struct {
	Amount float64
	Date   string
	Type   string
}
EOF

echo "📄 Creating internal/config/config.go..."
cat << 'EOF' > internal/config/config.go
package config

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
)

type Config struct {
	CSVFilePath  string
	DBPath       string
	TTLDays      int
	BaseAPIURL   string
	ForceRefresh bool
	PurgeCache   bool
}

func GetDefaultDBPath() string {
	cacheDir, err := os.UserCacheDir()
	if err != nil {
		cacheDir = "."
	}
	return filepath.Join(cacheDir, "khipusol", "cache.db")
}

func ParseFlagsAndEnv() (Config, error) {
	forceRefresh := flag.Bool("force-refresh", false, "Force fetching fresh rates from SUNAT API")
	flag.BoolVar(forceRefresh, "f", false, "Force refresh (shorthand)")

	purgeCache := flag.Bool("purge", false, "Clear all cached records in local database and exit")
	flag.BoolVar(purgeCache, "p", false, "Purge cache (shorthand)")

	customDBPath := flag.String("db-path", "", "Path to local bbolt cache database file")
	flag.StringVar(customDBPath, "d", "", "Path to local db (shorthand)")

	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Usage: khipusol [options] <path_to_payments.csv>\n\nOptions:\n")
		flag.PrintDefaults()
	}

	flag.Parse()

	dbPath := *customDBPath
	if dbPath == "" {
		dbPath = os.Getenv("CACHE_DB_PATH")
	}
	if dbPath == "" {
		dbPath = GetDefaultDBPath()
	}

	ttlDays := 30
	if envTTL := os.Getenv("CACHE_TTL_DAYS"); envTTL != "" {
		if parsedTTL, err := strconv.Atoi(envTTL); err == nil && parsedTTL > 0 {
			ttlDays = parsedTTL
		}
	}

	apiURL := os.Getenv("EXCHANGE_API_URL")
	if apiURL == "" {
		apiURL = "https://api.exchanger.example.com/rates"
	}

	cfg := Config{
		DBPath:       dbPath,
		TTLDays:      ttlDays,
		BaseAPIURL:   apiURL,
		ForceRefresh: *forceRefresh,
		PurgeCache:   *purgeCache,
	}

	if !cfg.PurgeCache {
		args := flag.Args()
		if len(args) < 1 {
			flag.Usage()
			return cfg, fmt.Errorf("missing required payments CSV argument")
		}
		cfg.CSVFilePath = args[0]
	}

	return cfg, nil
}
EOF

echo "📄 Creating internal/fetcher/fetcher.go..."
cat << 'EOF' > internal/fetcher/fetcher.go
package fetcher

import "https://github.com/mistergamarra//khipusol/internal/model"

type RateFetcher interface {
	FetchRates(month, year string) ([]model.ExchangeRateRecord, error)
}
EOF

echo "📄 Creating internal/fetcher/mock_fetcher.go..."
cat << 'EOF' > internal/fetcher/mock_fetcher.go
package fetcher

import (
	"encoding/json"
	"fmt"

	"github.com/mistergamarra/khipusol/internal/model"
)

type SunatAPIFetcher struct {
	BaseURL string
}

func NewSunatAPIFetcher(baseURL string) *SunatAPIFetcher {
	return &SunatAPIFetcher{BaseURL: baseURL}
}

func (f *SunatAPIFetcher) FetchRates(month, year string) ([]model.ExchangeRateRecord, error) {
	apiURL := fmt.Sprintf("%s?month=%s&year=%s", f.BaseURL, month, year)
	_ = apiURL

	mockJSON := `[
		{"fecPublica":"01/03/2022","valTipo":"3.753","codTipo":"C"},
		{"fecPublica":"01/03/2022","valTipo":"3.759","codTipo":"V"},
		{"fecPublica":"04/03/2022","valTipo":"3.725","codTipo":"C"},
		{"fecPublica":"04/03/2022","valTipo":"3.735","codTipo":"V"},
		{"fecPublica":"15/03/2022","valTipo":"3.708","codTipo":"C"},
		{"fecPublica":"15/03/2022","valTipo":"3.715","codTipo":"V"},
		{"fecPublica":"31/03/2022","valTipo":"3.723","codTipo":"C"},
		{"fecPublica":"31/03/2022","valTipo":"3.728","codTipo":"V"}
	]`

	var rates []model.ExchangeRateRecord
	if err := json.Unmarshal([]byte(mockJSON), &rates); err != nil {
		return nil, fmt.Errorf("failed to decode exchange rate response: %w", err)
	}

	return rates, nil
}
EOF

echo "📄 Creating internal/storage/storage.go..."
cat << 'EOF' > internal/storage/storage.go
package storage

import "github.com/mistergamarra/khipusol/internal/model"

type CacheStorage interface {
	Get(key string) (*model.CachedPayload, error)
	Set(key string, payload model.CachedPayload) error
	Purge() error
	Close() error
}
EOF

echo "📄 Creating internal/storage/bbolt_storage.go..."
cat << 'EOF' > internal/storage/bbolt_storage.go
package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/mistergamarra/khipusol/internal/model"
	bolt "go.etcd.io/bbolt"
)

type BBoltStorage struct {
	db     *bolt.DB
	bucket []byte
}

func NewBBoltStorage(dbPath string) (*BBoltStorage, error) {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create OS cache dir: %w", err)
	}

	db, err := bolt.Open(dbPath, 0600, &bolt.Options{
		Timeout:      2 * time.Second,
		NoGrowthSync: false,
	})
	if err != nil {
		return nil, fmt.Errorf("could not open db at %s: %w", dbPath, err)
	}

	bucketName := []byte("ExchangeRatesCache")

	err = db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists(bucketName)
		return err
	})
	if err != nil {
		db.Close()
		return nil, err
	}

	return &BBoltStorage{db: db, bucket: bucketName}, nil
}

func (s *BBoltStorage) Get(key string) (*model.CachedPayload, error) {
	var payload model.CachedPayload
	var found bool

	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(s.bucket)
		data := b.Get([]byte(key))
		if data == nil {
			return nil
		}
		found = true
		return json.Unmarshal(data, &payload)
	})

	if err != nil {
		return nil, err
	}
	if !found {
		return nil, nil
	}
	return &payload, nil
}

func (s *BBoltStorage) Set(key string, payload model.CachedPayload) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(s.bucket)
		return b.Put([]byte(key), data)
	})
}

func (s *BBoltStorage) Purge() error {
	return s.db.Update(func(tx *bolt.Tx) error {
		err := tx.DeleteBucket(s.bucket)
		if err != nil && err != bolt.ErrBucketNotFound {
			return err
		}
		_, err = tx.CreateBucketIfNotExists(s.bucket)
		return err
	})
}

func (s *BBoltStorage) Close() error {
	if s.db != nil {
		return s.db.Close()
	}
	return nil
}
EOF

echo "📄 Creating internal/processor/processor.go..."
cat << 'EOF' > internal/processor/processor.go
package processor

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/mistergamarra/khipusol/internal/config"
	"github.com/mistergamarra/khipusol/internal/fetcher"
	"github.com/mistergamarra/khipusol/internal/model"
	"github.com/mistergamarra/khipusol/internal/storage"
)

type PaymentProcessor struct {
	cfg     config.Config
	cache   storage.CacheStorage
	fetcher fetcher.RateFetcher
}

func NewPaymentProcessor(cfg config.Config, cache storage.CacheStorage, fetcher fetcher.RateFetcher) *PaymentProcessor {
	return &PaymentProcessor{
		cfg:     cfg,
		cache:   cache,
		fetcher: fetcher,
	}
}

func (p *PaymentProcessor) GetRates(month, year string) ([]model.ExchangeRateRecord, error) {
	cacheKey := fmt.Sprintf("%s/%s", month, year)
	ttlDuration := time.Duration(p.cfg.TTLDays) * 24 * time.Hour

	if !p.cfg.ForceRefresh {
		payload, err := p.cache.Get(cacheKey)
		if err == nil && payload != nil && len(payload.Rates) > 0 {
			if time.Since(payload.FetchedAt) < ttlDuration {
				fmt.Printf("[CACHE HIT] Valid local rate used for %s (Age: %s / TTL: %d days)\n",
					cacheKey, time.Since(payload.FetchedAt).Round(time.Second), p.cfg.TTLDays)
				return payload.Rates, nil
			}
			fmt.Printf("[CACHE EXPIRED] Record for %s exceeded TTL. Refreshing...\n", cacheKey)
		} else {
			fmt.Printf("[CACHE MISS] Fetching rates online for %s...\n", cacheKey)
		}
	} else {
		fmt.Printf("[FORCE REFRESH] Bypassing cache for %s...\n", cacheKey)
	}

	rates, err := p.fetcher.FetchRates(month, year)
	if err != nil {
		return nil, err
	}

	newPayload := model.CachedPayload{
		FetchedAt: time.Now(),
		Rates:     rates,
	}
	_ = p.cache.Set(cacheKey, newPayload)

	return rates, nil
}

func (p *PaymentProcessor) Process() error {
	cleanPath := filepath.Clean(p.cfg.CSVFilePath)
	file, err := os.Open(cleanPath)
	if err != nil {
		return fmt.Errorf("unable to open CSV (%s): %w", cleanPath, err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	if _, err := reader.Read(); err != nil {
		return fmt.Errorf("failed to read CSV header: %w", err)
	}

	fmt.Println("\n--- Processing Payment CSV Records ---")

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("Row parsing error: %v", err)
			continue
		}

		amountStr, dateStr := record[0], record[1]
		rateType := "V"
		if len(record) > 2 && record[2] != "" {
			rateType = strings.TrimSpace(record[2])
		}

		amount, err := strconv.ParseFloat(amountStr, 64)
		if err != nil {
			log.Printf("Invalid amount '%s'", amountStr)
			continue
		}

		parsedDate, err := time.Parse("02/01/2006", dateStr)
		if err != nil {
			log.Printf("Invalid date format '%s' (expected DD/MM/YYYY)", dateStr)
			continue
		}

		month := fmt.Sprintf("%02d", parsedDate.Month())
		year := fmt.Sprintf("%d", parsedDate.Year())

		rates, err := p.GetRates(month, year)
		if err != nil {
			log.Printf("Error fetching rates for %s/%s: %v", month, year, err)
			continue
		}

		var matchedRate float64
		found := false
		for _, rate := range rates {
			if rate.FecPublica == dateStr && strings.EqualFold(rate.CodTipo, rateType) {
				matchedRate, err = strconv.ParseFloat(rate.ValTipo, 64)
				if err == nil {
					found = true
					break
				}
			}
		}

		if !found {
			log.Printf("No matching exchange rate for %s (type %s)", dateStr, rateType)
			continue
		}

		converted := amount * matchedRate
		fmt.Printf("Date: %s | Amount: %10.2f | Rate (%s): %.4f | Converted: %10.2f\n",
			dateStr, amount, rateType, matchedRate, converted)
	}

	return nil
}
EOF

echo "📄 Creating main.go..."
cat << 'EOF' > main.go
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/mistergamarra/khipusol/internal/config"
	"github.com/mistergamarra/khipusol/internal/fetcher"
	"github.com/mistergamarra/khipusol/internal/processor"
	"github.com/mistergamarra/khipusol/internal/storage"
)

func main() {
	cfg, err := config.ParseFlagsAndEnv()
	if err != nil {
		os.Exit(1)
	}

	store, err := storage.NewBBoltStorage(cfg.DBPath)
	if err != nil {
		log.Fatalf("Storage initialization error: %v", err)
	}
	defer store.Close()

	if cfg.PurgeCache {
		if err := store.Purge(); err != nil {
			log.Fatalf("Failed to purge cache: %v", err)
		}
		fmt.Println("Local exchange rate cache purged successfully.")
		return
	}

	apiFetcher := fetcher.NewSunatAPIFetcher(cfg.BaseAPIURL)
	appProcessor := processor.NewPaymentProcessor(cfg, store, apiFetcher)

	if err := appProcessor.Process(); err != nil {
		log.Fatalf("Error processing payment CSV: %v", err)
	}
}
EOF

echo "📊 Creating sample payments.csv..."
cat << 'EOF' > payments.csv
amount,date,type
150.50,01/03/2022,C
200.00,04/03/2022,V
1250.75,31/03/2022,V
EOF

echo "🧹 Downloading Go dependencies & updating checksums..."
go mod tidy

echo "✅ Success! Project structure created for 'khipusol'."