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

// UpdateT ...
func (mrTable *TableTypePost) UpdateT(queryable mingru.Queryable, id uint64, content string) (int, error) {
	result, err := queryable.Exec("UPDATE `db_post` SET `title` = \"haha\", `content` = ?, `cmt_c` = `cmt_c` + 1 WHERE `id` = ?", content, id)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
