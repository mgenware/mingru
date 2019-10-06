package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableTResult ...
type PostTableTResult struct {
	Year  int
	Total int
}

// T ...
func (da *TableTypePost) T(queryable dbx.Queryable, id uint64, year int, total int) (*PostTableTResult, error) {
	result := &PostTableTResult{}
	err := queryable.QueryRow("SELECT YEAR(`datetime`) AS `year`, SUM(`cmt_c`) AS `total` FROM `db_post` WHERE `id` = ? GROUP BY `year`, `total` HAVING `year` > ? AND `total` > ?", id, year, total).Scan(&result.Year, &result.Total)
	if err != nil {
		return nil, err
	}
	return result, nil
}
