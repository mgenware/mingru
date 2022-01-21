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
func (mrTable *TableTypePost) UpdateT(queryable mingru.Queryable, title string, content string, content2 string) (int, error) {
	result, err := queryable.Exec("UPDATE `db_post` SET `content` = ?, `title` = \"haha\" WHERE (`title` = ? AND `content` = ?)", content2, title, content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
