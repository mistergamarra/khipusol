package fetcher

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/mistergamarra/khipusol/internal/model"
)

type StaticRepoFetcher struct {
	BaseURL string
}

func NewStaticRepoFetcher(baseURL string) *StaticRepoFetcher {
	if baseURL == "" {
		// Updated to point directly to your main khipusol repo rates folder
		baseURL = "https://cdn.jsdelivr.net/gh/mistergamarra/khipusol@main/rates"
	}
	return &StaticRepoFetcher{BaseURL: baseURL}
}

func (f *StaticRepoFetcher) FetchRates(monthStr, yearStr string) ([]model.ExchangeRateRecord, error) {
	// Construct URL matching your year/month folder structure: rates/YYYY/MM.json
	targetURL := fmt.Sprintf("%s/%s/%s.json", f.BaseURL, yearStr, monthStr)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(targetURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch static rates for %s/%s: %w", monthStr, yearStr, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("rates repository returned status %d for %s/%s (URL: %s)", resp.StatusCode, monthStr, yearStr, targetURL)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read static rates response: %w", err)
	}

	var rates []model.ExchangeRateRecord
	if err := json.Unmarshal(bodyBytes, &rates); err != nil {
		return nil, fmt.Errorf("failed to parse static rates JSON for %s/%s: %w", monthStr, yearStr, err)
	}

	return rates, nil
}
