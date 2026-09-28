package storage

import "github.com/mistergamarra/khipusol/internal/model"

type CacheStorage interface {
	Get(key string) (*model.CachedPayload, error)
	Set(key string, payload model.CachedPayload) error
	Purge() error
	Close() error
}
