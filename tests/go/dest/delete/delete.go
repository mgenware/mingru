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

func (mrTable *TableTypePost) DeleteT(mrQueryable mingru.Queryable, id uint64) (int, error) {
	result, err := mrQueryable.Exec("DELETE FROM `db_post` WHERE `id` = ?", id)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
