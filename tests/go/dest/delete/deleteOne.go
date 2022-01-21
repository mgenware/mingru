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

// DeleteT ...
func (da *TableTypePost) DeleteT(queryable mingru.Queryable, id uint64) error {
	result, err := queryable.Exec("DELETE FROM `db_post` WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
