package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// ------------ Actions ------------

type PostTableTResult struct {
	Name1 int
}

func (mrTable *TableTypePost) T(mrQueryable mingru.Queryable, idInput uint64) (PostTableTResult, error) {
	var result PostTableTResult
	err := mrQueryable.QueryRow("SELECT YEAR(YEAR(`id`)) AS `name1` FROM `db_post` WHERE YEAR(YEAR(`id`)) == ?", idInput).Scan(&result.Name1)
	if err != nil {
		return result, err
	}
	return result, nil
}
