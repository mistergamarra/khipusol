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
	forceRefresh := flag.Bool("force-refresh", false, "Force fetching fresh rates from CDN")
	flag.BoolVar(forceRefresh, "f", false, "Force refresh (shorthand)")

	purgeCache := flag.Bool("purge", false, "Clear all cached records in local database and exit")
	flag.BoolVar(purgeCache, "p", false, "Purge cache (shorthand)")

	customDBPath := flag.String("db-path", "", "Path to local bbolt cache database file")
	flag.StringVar(customDBPath, "d", "", "Path to local db (shorthand)")

	debugMode := flag.Bool("debug", false, "Enable verbose HTTP request/response debugging")
	flag.BoolVar(debugMode, "v", false, "Enable debug mode (shorthand)")

	outputPath := flag.String("output", "", "Path to export converted results as a new CSV file")
	flag.StringVar(outputPath, "o", "", "Path to export CSV (shorthand)")

	versionFlag := flag.Bool("version", false, "Print the version number and exit")

	// Beautiful Custom Help Output
	flag.Usage = func() {
		fmt.Println("☀️🇵🇪 Khipusol CLI - Automated SUNAT Currency Conversion")
		fmt.Println("\nUsage:")
		fmt.Println("  khipusol [flags] <path_to_payments.csv>")
		fmt.Println("\nAvailable Flags:")
		fmt.Println("  -o, --output string      Path to export converted results as a new CSV file")
		fmt.Println("  -f, --force-refresh      Force fetching fresh rates from CDN")
		fmt.Println("  -p, --purge              Clear all cached records in local database and exit")
		fmt.Println("  -v, --debug              Enable verbose HTTP request/response debugging")
		fmt.Println("  -d, --db-path string     Path to local bbolt cache database file")
		fmt.Println("      --version            Print the version number and exit")
		fmt.Println("  -h, --help               Display this help message")
		fmt.Println("\nExamples:")
		fmt.Println("  khipusol payments.csv")
		fmt.Println("  khipusol -o converted.csv payments.csv")
		fmt.Println("  khipusol --force-refresh payments.csv")
		fmt.Println("\nAuthor & Support:")
		fmt.Println("  Created by Mister Gamarra")
		fmt.Println("  Email: mister.gamarra@gmail.com")
		fmt.Println("  GitHub: https://github.com/mistergamarra/khipusol")
		fmt.Println("  Issues: https://github.com/mistergamarra/khipusol/issues")
	}

	flag.Parse()

	// Handle --version flag
	if *versionFlag {
		fmt.Printf("khipusol version %s\n", Version)
		os.Exit(0)
	}

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
		apiURL = "https://cdn.jsdelivr.net/gh/mistergamarra/rates@main/rates"
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
			fmt.Fprintln(os.Stderr, "❌ Error: Missing required payments CSV argument.\n")
			flag.Usage()
			return cfg, fmt.Errorf("missing required payments CSV argument")
		}
		cfg.CSVFilePath = args[0]
	}

	return cfg, nil
}
