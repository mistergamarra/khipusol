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
