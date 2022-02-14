package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

type PostTableTResult struct {
	ID uint64
}

func (mrTable *TableTypePost) T(mrQueryable mingru.Queryable, nDatetime *time.Time, p2 time.Time, p3 *time.Time, p4 uint64, p5 *uint64) (PostTableTResult, error) {
	var result PostTableTResult
	err := mrQueryable.QueryRow("SELECT `id` FROM `db_post` WHERE ? ? ? ? ?", nDatetime, p2, p3, p4, p5).Scan(&result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}
