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
	Name1 int
}

// T ...
func (mrTable *TableTypePost) T(mrQueryable mingru.Queryable, idInput uint64) (PostTableTResult, error) {
	var result PostTableTResult
	err := mrQueryable.QueryRow("SELECT YEAR(YEAR(`id`)) AS `name1` FROM `db_post` WHERE YEAR(YEAR(`id`)) == ?", idInput).Scan(&result.Name1)
	if err != nil {
		return result, err
	}
	return result, nil
}
