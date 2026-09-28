package fetcher

import "github.com/mistergamarra/khipusol/internal/model"

type RateFetcher interface {
	FetchRates(month, year string) ([]model.ExchangeRateRecord, error)
}
