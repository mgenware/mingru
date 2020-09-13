package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable mingru.Queryable, title string, content string, content2 string) (int, error) {
	result, err := queryable.Exec("UPDATE `db_post` SET `content` = ?, `title` = \"haha\" WHERE `title` = ? AND `content` = ?", content2, title, content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
