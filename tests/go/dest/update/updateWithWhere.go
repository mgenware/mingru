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

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable mingru.Queryable, id uint64, content2 string, content string) error {
	result, err := queryable.Exec("UPDATE `db_post` SET `title` = \"haha\", `content` = ? WHERE `id` = ? AND `content` = ?", content, id, content2)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
