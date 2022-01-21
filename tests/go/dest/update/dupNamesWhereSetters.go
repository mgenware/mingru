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
func (mrTable *TableTypePost) UpdateT(queryable mingru.Queryable, title string, content string, mUserID uint64) (int, error) {
	result, err := queryable.Exec("UPDATE `db_post` SET `content` = ?, `title` = \"haha\", `my_user_id` = ? WHERE `title` = ? `title` = ? AND `content` = ?", content, mUserID, title, title, content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
