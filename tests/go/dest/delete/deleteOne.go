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

// DeleteT ...
func (mrTable *TableTypePost) DeleteT(mrQueryable mingru.Queryable, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM `db_post` WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
