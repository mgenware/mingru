package da

import (
	"fmt"
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGTResult struct {
	ID uint64
}

func (mrTable *PostAGType) T(mrQueryable mingru.Queryable, nDatetime []*time.Time, p2 time.Time, p3 *time.Time, p4 uint64, p5 *uint64) (PostAGTResult, error) {
	if len(nDatetime) == 0 {
		return PostAGTResult{}, fmt.Errorf("the array argument `nDatetime` cannot be empty")
	}
	var result PostAGTResult
	var queryParams []interface{}
	for _, item := range nDatetime {
		queryParams = append(queryParams, item)
	}
	queryParams = append(queryParams, p2)
	queryParams = append(queryParams, p3)
	queryParams = append(queryParams, p4)
	queryParams = append(queryParams, p5)
	err := mrQueryable.QueryRow("SELECT `id` FROM `db_post` WHERE "+mingru.InputPlaceholders(len(nDatetime))+" ? ? ? ?", queryParams...).Scan(&result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}
