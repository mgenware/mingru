package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

type PostTableTResult struct {
	Total int
	Year  int
}

func (mrTable *TableTypePost) T(mrQueryable mingru.Queryable, id uint64, year int, total int) (PostTableTResult, error) {
	var result PostTableTResult
	err := mrQueryable.QueryRow("SELECT YEAR(`datetime`) AS `year`, SUM(`cmt_c`) AS `total` FROM `db_post` WHERE `id` = ? GROUP BY `year`, `total` HAVING (`year` > ? AND `total` > ?)", id, year, total).Scan(&result.Year, &result.Total)
	if err != nil {
		return result, err
	}
	return result, nil
}
