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
func (mrTable *TableTypePost) DeleteT(queryable mingru.Queryable, userID uint64) (int, error) {
	result, err := queryable.Exec("DELETE FROM `db_post` WHERE `user_id` = ?", userID)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
