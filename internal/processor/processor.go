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
				if p.cfg.Debug {
					fmt.Printf("[CACHE HIT] Valid local rate used for %s (Age: %s)\n", cacheKey, time.Since(payload.FetchedAt).Round(time.Second))
				}
				return payload.Rates, nil
			}
			if p.cfg.Debug {
				fmt.Printf("[CACHE EXPIRED] Record for %s exceeded TTL. Refreshing...\n", cacheKey)
			}
		} else {
			if p.cfg.Debug {
				fmt.Printf("[CACHE MISS] Fetching rates online for %s...\n", cacheKey)
			}
		}
	}

	rates, err := p.fetcher.FetchRates(month, year)
	if err != nil {
		return nil, err
	}

	if len(rates) > 0 {
		newPayload := model.CachedPayload{
			FetchedAt: time.Now(),
			Rates:     rates,
		}
		_ = p.cache.Set(cacheKey, newPayload)
	}

	return rates, nil
}

func (p *PaymentProcessor) Process() error {
	cleanPath := filepath.Clean(p.cfg.CSVFilePath)
	file, err := os.Open(cleanPath)
	if err != nil {
		return fmt.Errorf("unable to open CSV (%s): %w", cleanPath, err)
	}
	defer file.Close()

	// Setup optional output CSV writer
	var outFile *os.File
	var csvWriter *csv.Writer
	if p.cfg.OutputPath != "" {
		outCleanPath := filepath.Clean(p.cfg.OutputPath)
		if err := os.MkdirAll(filepath.Dir(outCleanPath), 0755); err != nil {
			return fmt.Errorf("failed to create output directory: %w", err)
		}
		outFile, err = os.Create(outCleanPath)
		if err != nil {
			return fmt.Errorf("failed to create output CSV file: %w", err)
		}
		defer outFile.Close()

		csvWriter = csv.NewWriter(outFile)
		defer csvWriter.Flush()

		// Write output CSV header
		if err := csvWriter.Write([]string{"amount", "date", "type", "exchange_rate", "converted_amount"}); err != nil {
			return fmt.Errorf("failed to write output header: %w", err)
		}
	}

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

		// Write to output CSV if configured
		if csvWriter != nil {
			row := []string{
				fmt.Sprintf("%.2f", amount),
				dateStr,
				rateType,
				fmt.Sprintf("%.4f", matchedRate),
				fmt.Sprintf("%.2f", converted),
			}
			if err := csvWriter.Write(row); err != nil {
				log.Printf("Error writing row to output CSV: %v", err)
			}
		}
	}

	if p.cfg.OutputPath != "" {
		fmt.Printf("\n✨ Converted results successfully exported to: %s\n", p.cfg.OutputPath)
	}

	return nil
}
