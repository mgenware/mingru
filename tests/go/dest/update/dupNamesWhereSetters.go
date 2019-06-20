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
func (da *TableTypePost) UpdateT(queryable dbx.Queryable, title string, content string, mUserID uint64) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `content` = ?, `title` = \"haha\", `my_user_id` = ? WHERE `title` = ? `title` = ? AND `content` = ?", content, mUserID, title, title, content)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
