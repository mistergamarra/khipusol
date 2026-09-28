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
	Debug        bool
	OutputPath   string
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

	debugMode := flag.Bool("debug", false, "Enable verbose HTTP request/response debugging")
	flag.BoolVar(debugMode, "v", false, "Enable debug mode (shorthand)")

	// Add output flag for CSV export
	outputPath := flag.String("output", "", "Path to export converted results as a new CSV file")
	flag.StringVar(outputPath, "o", "", "Path to export CSV (shorthand)")

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

	apiURL := os.Getenv("RATES_REPO_URL")
	if apiURL == "" {
		apiURL = os.Getenv("EXCHANGE_API_URL")
	}
	if apiURL == "" {
		apiURL = "https://cdn.jsdelivr.net/gh/mistergamarra/khipusol-rates@main/rates"
	}

	isDebug := *debugMode
	if !isDebug && os.Getenv("DEBUG") == "true" {
		isDebug = true
	}

	cfg := Config{
		DBPath:       dbPath,
		TTLDays:      ttlDays,
		BaseAPIURL:   apiURL,
		ForceRefresh: *forceRefresh,
		PurgeCache:   *purgeCache,
		Debug:        isDebug,
		OutputPath:   *outputPath,
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
