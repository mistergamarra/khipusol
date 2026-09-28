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
		Timeout:    2 * time.Second,
		NoGrowSync: false,
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
