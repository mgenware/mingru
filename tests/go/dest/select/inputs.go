package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableTResult ...
type PostTableTResult struct {
	ID uint64
}

// T ...
func (da *TableTypePost) T(queryable mingru.Queryable, nDatetime *time.Time, p2 time.Time, p3 *time.Time, p4 uint64, p5 *uint64) (*PostTableTResult, error) {
	result := &PostTableTResult{}
	err := queryable.QueryRow("SELECT `id` FROM `db_post` WHERE ? ? ? ? ?", nDatetime, p2, p3, p4, p5).Scan(&result.ID)
	if err != nil {
		return nil, err
	}
	return result, nil
}
