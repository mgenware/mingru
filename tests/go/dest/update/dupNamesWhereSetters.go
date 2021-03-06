package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable mingru.Queryable, title string, content string, mUserID uint64) (int, error) {
	result, err := queryable.Exec("UPDATE `db_post` SET `content` = ?, `title` = \"haha\", `my_user_id` = ? WHERE `title` = ? `title` = ? AND `content` = ?", content, mUserID, title, title, content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
