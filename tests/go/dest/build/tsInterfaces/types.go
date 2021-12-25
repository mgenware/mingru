package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

// ------------ Result types ------------

// Res1 ...
type Res1 struct {
	ID uint64
}

// Res2 ...
type Res2 struct {
	DisplayName string
	Sig         *string
}

// Res3 ...
type Res3 struct {
	DisplayName string
	NDatetime   *time.Time
	Sig         *string
}

// ------------ Interfaces ------------

// Type1 ...
type Type1 interface {
	SelectByID(queryable mingru.Queryable, id uint64) (Res1, error)
}

// Type2 ...
type Type2 interface {
	SelectPostInfo(queryable mingru.Queryable) (PostTableSelectPostInfoResult, error)
}
