package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// DeleteT ...
func (da *TableTypePost) DeleteT(queryable mingru.Queryable, id uint64) (int, error) {
	result, err := queryable.Exec("DELETE FROM `db_post` WHERE `id` = ?", id)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
