package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable mingru.Queryable, content string) (int, error) {
	result, err := queryable.Exec("UPDATE `db_post` SET `title` = \"haha\", `content` = ?", content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
