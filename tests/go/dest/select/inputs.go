package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

type PostTableTResult struct {
	ID uint64
}

func (mrTable *PostAGType) T(mrQueryable mingru.Queryable, nDatetime *time.Time, p2 time.Time, p3 *time.Time, p4 uint64, p5 *uint64) (PostTableTResult, error) {
	var result PostTableTResult
	err := mrQueryable.QueryRow("SELECT `id` FROM `db_post` WHERE ? ? ? ? ?", nDatetime, p2, p3, p4, p5).Scan(&result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}
