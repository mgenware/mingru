package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// PostTableTResult ...
type PostTableTResult struct {
	Total int
	Year  int
}

// T ...
func (mrTable *TableTypePost) T(mrQueryable mingru.Queryable, id uint64, year int, total int) (PostTableTResult, error) {
	var result PostTableTResult
	err := mrQueryable.QueryRow("SELECT YEAR(`datetime`) AS `year`, SUM(`cmt_c`) AS `total` FROM `db_post` WHERE `id` = ? GROUP BY `year`, `total` HAVING (`year` > ? AND `total` > ?)", id, year, total).Scan(&result.Year, &result.Total)
	if err != nil {
		return result, err
	}
	return result, nil
}
