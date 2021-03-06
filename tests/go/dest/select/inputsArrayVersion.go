package da

import (
	"fmt"
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
func (da *TableTypePost) T(queryable mingru.Queryable, nDatetime []*time.Time, p2 time.Time, p3 *time.Time, p4 uint64, p5 *uint64) (PostTableTResult, error) {
	if len(nDatetime) == 0 {
		return PostTableTResult{}, fmt.Errorf("The array argument `nDatetime` cannot be empty")
	}
	var result PostTableTResult
	var queryParams []interface{}
	for _, item := range nDatetime {
		queryParams = append(queryParams, item)
	}
	queryParams = append(queryParams, p2)
	queryParams = append(queryParams, p3)
	queryParams = append(queryParams, p4)
	queryParams = append(queryParams, p5)
	err := queryable.QueryRow("SELECT `id` FROM `db_post` WHERE "+mingru.InputPlaceholders(len(nDatetime))+" ? ? ? ?", queryParams...).Scan(&result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}
