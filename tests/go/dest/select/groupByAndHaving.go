package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGTResult struct {
	Total int
	Year  int
}

func (mrTable *PostAGType) T(mrQueryable mingru.Queryable, id uint64, year int, total int) (PostAGTResult, error) {
	var result PostAGTResult
	err := mrQueryable.QueryRow("SELECT YEAR(`datetime`) AS `year`, SUM(`cmt_c`) AS `total` FROM `db_post` WHERE `id` = ? GROUP BY `year`, `total` HAVING (`year` > ? AND `total` > ?)", id, year, total).Scan(&result.Year, &result.Total)
	if err != nil {
		return result, err
	}
	return result, nil
}
