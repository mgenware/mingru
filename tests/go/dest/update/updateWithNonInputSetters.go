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
func (da *TableTypePost) UpdateT(queryable dbx.Queryable, content string) (int, error) {
	result, err := queryable.Exec("UPDATE `db_post` SET `title` = \"haha\", `content` = ?", content)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
