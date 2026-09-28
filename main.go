package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv" // Import godotenv
	"github.com/mistergamarra/khipusol/internal/config"
	"github.com/mistergamarra/khipusol/internal/fetcher"
	"github.com/mistergamarra/khipusol/internal/processor"
	"github.com/mistergamarra/khipusol/internal/storage"
)

func main() {
	_ = godotenv.Load()

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

	apiFetcher := fetcher.NewStaticRepoFetcher(cfg.BaseAPIURL)
	appProcessor := processor.NewPaymentProcessor(cfg, store, apiFetcher)

	if err := appProcessor.Process(); err != nil {
		log.Fatalf("Error processing payment CSV: %v", err)
	}
}
