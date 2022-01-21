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
	Name1 int
}

// T ...
func (da *TableTypePost) T(queryable mingru.Queryable, idInput uint64) (PostTableTResult, error) {
	var result PostTableTResult
	err := queryable.QueryRow("SELECT YEAR(YEAR(`id`)) AS `name1` FROM `db_post` WHERE YEAR(YEAR(`id`)) == ?", idInput).Scan(&result.Name1)
	if err != nil {
		return result, err
	}
	return result, nil
}
