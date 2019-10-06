package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable dbx.Queryable, id uint64, content2 string, content string) error {
	result, err := queryable.Exec("UPDATE `db_post` SET `title` = \"haha\", `content` = ? WHERE `id` = ? AND `content` = ?", content, id, content2)
	return dbx.CheckOneRowAffectedWithError(result, err)
}
