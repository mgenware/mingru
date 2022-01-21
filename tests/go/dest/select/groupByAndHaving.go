package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (da *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// PostTableTResult ...
type PostTableTResult struct {
	Total int
	Year  int
}

// T ...
func (da *TableTypePost) T(queryable mingru.Queryable, id uint64, year int, total int) (PostTableTResult, error) {
	var result PostTableTResult
	err := queryable.QueryRow("SELECT YEAR(`datetime`) AS `year`, SUM(`cmt_c`) AS `total` FROM `db_post` WHERE `id` = ? GROUP BY `year`, `total` HAVING (`year` > ? AND `total` > ?)", id, year, total).Scan(&result.Year, &result.Total)
	if err != nil {
		return result, err
	}
	return result, nil
}
