package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable mingru.Queryable, id uint64, content2 string, content string) error {
	result, err := queryable.Exec("UPDATE `db_post` SET `title` = \"haha\", `content` = ? WHERE `id` = ? AND `content` = ?", content, id, content2)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
