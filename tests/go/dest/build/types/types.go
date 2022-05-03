package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

// ------------ Result types ------------

type Res1 struct {
	ID uint64
}

type Res2 struct {
	DisplayName string
	Sig         *string
}

type Res3 struct {
	NDatetime *time.Time
}

// ------------ Interfaces ------------

type Type1 interface {
	SelectByID(mrQueryable mingru.Queryable, id uint64) (Res1, error)
}

type Type2 interface {
	SelectPostInfo(mrQueryable mingru.Queryable) (PostAGSelectPostInfoResult, error)
}
