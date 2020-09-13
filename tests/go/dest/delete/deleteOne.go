package da

import "github.com/mgenware/go-packagex/dbx"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// DeleteT ...
func (da *TableTypePost) DeleteT(queryable mingru.Queryable, id uint64) error {
	result, err := queryable.Exec("DELETE FROM `db_post` WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
