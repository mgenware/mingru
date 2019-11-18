package da

import (
	"time"

	"github.com/mgenware/go-packagex/v5/dbx"
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
	NDatetime *time.Time
}

// ------------ Interfaces ------------

// Type1 ...
type Type1 interface {
	SelectByID(queryable dbx.Queryable, id uint64) (*Res1, error)
}

// Type2 ...
type Type2 interface {
	SelectPostInfo(queryable dbx.Queryable) (*PostTableSelectPostInfoResult, error)
}
